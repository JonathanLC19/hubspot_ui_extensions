const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const exp = require("constants");
const hubspot = require("@hubspot/api-client");
const JSONLoader = require("./sop_documents.json");

// const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
// const { TextLoader } = require("langchain/document_loaders/fs/text");

dotenv.config();

// Entry function of this module, it fetches associated deals and calculates the statistics
exports.main = async (context = {}) => {
  const { hs_object_id } = context.parameters;
  // console.log("hs_object_id: ", hs_object_id);

  const sopDocs = JSONLoader;
  console.log("SOPs: ", sopDocs);

  const docResult = await readDocxFile(fullPath);
  const fileContent = docResult.content;
  // console.log("SOP: ", fileContent);
  // ####################################################################################################
  const contactIds = await getAssociatedContacts(hs_object_id);
  const engmIds = await getAssociatedMessages(contactIds);
  let messages = [];
  if (engmIds.length > 0) {
    const messagePromises = engmIds.map((id) => getEngagement(id));
    messages = await Promise.all(messagePromises);
  }
  // console.log("Messages: ", JSON.stringify(messages, null, 2));

  // Filter messages that don't have conversationsThreadId in metadata
  let communications = [];
  const messagesNoThreads = messages.filter(
    (msg) => msg.metadata && !msg.metadata.conversationsThreadId,
  );
  if (messagesNoThreads.length > 0) {
    communications = messagesNoThreads;
  }
  // console.log("Communications: ", JSON.stringify(communications, null, 2));
  const flatCommunications = communications.flat();
  // console.log(
  //   "Flatted Communications: ",
  //   JSON.stringify(flatCommunications, null, 2),
  // );
  // Normalize the messages
  const normalizedMessages = flatCommunications.map((msg) => ({
    engagement: msg.engagement,
    // type: msg.type,
    // direction: msg.direction,
    // createdAt: msg.createdAt,
    // bodyPreview: msg.bodyPreview
    //   .replace(/[^\w\s]/g, "")
    //   .replace(/\n/g, " ")
    //   .replace(/\s+/g, " ")
    //   .trim(),
  }));
  // console.log(
  //   "Normalized Messages: ",
  //   JSON.stringify(normalizedMessages, null, 2),
  // );
  const messagesMetadata = normalizedMessages.map((msg) => ({
    type: msg.engagement.type,
    id: msg.engagement.id,
    createdAt: msg.engagement.createdAt,
    bodyPreview: msg.engagement.bodyPreview
      ? msg.engagement.bodyPreview
          .replace(/[^\p{L}\s]/gu, "")
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "",
  }));

  // console.log({ docs });
  // console.log("Messages Metadata: ", JSON.stringify(messagesMetadata, null, 2));

  // Filter messages that have conversationsThreadId in metadata
  let threads = [];
  const messagesWithThreads = messages.filter(
    (msg) => msg.metadata && msg.metadata.conversationsThreadId,
  );
  if (messagesWithThreads.length > 0) {
    const threadPromises = messagesWithThreads.map((msg) =>
      getThread(msg.metadata.conversationsThreadId),
    );
    threads = await Promise.all(threadPromises);
  }
  // console.log("Threads: ", JSON.stringify(threads, null, 2));
  const flatThreads = threads.flat();
  // console.log("Flatted Threads: ", JSON.stringify(flatThreads, null, 2));
  const threadsMetadata = flatThreads.map((msg) => ({
    threadId: msg.conversationsThreadId,
    channelId: msg.channelId,
    direction: msg.direction,
    createdAt: msg.createdAt,
    text: msg.text
      .replace(/[^\w\s]/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));

  // console.log(JSONLoader);

  // Get OpenAI API key from secrets
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not found in secrets");
  }
  const { prompt } = context.parameters;
  // console.log("Question: ", prompt);
  // console.log("#################################################");

  // System prompt
  const system = `You are a helpful guest experience agent in an accommodation company.
  To find the troubleshooting hints for this case: ${prompt}, first identify the different issues, requests, questions, feedback, etc. the case is related to and then list the specific SOP documents from these SOPs: ${JSON.stringify(sopDocs, null, 2)} that you suggest to
  go and get the resolution hints. If you find more than one issue, request, question, etc. return the SOP refered to each one of them.
  If some of the reasons are related to requests, look for documents related to request handling, like cleaning requests or extension requests.
  If some of the reasons are related to issues like malfunctions, broken furniture, or other problems, look for documents related to these issues, like malfunctions, broken furniture, etc.
  If some of the reasons are related to complaints, look for documents related to complaints, like complaints, complaints handling, etc.
  If some of the reasons are related to feedback, look for documents related to feedback, like feedback, feedback handling, etc.
  Return only the source name of each SOP document.
`;
  // const system = `You are a helpful guest experience agent in an accommodation company.
  // Here are the Standard Operating Procedures (SOPs) for guest experience: ${JSON.stringify(sopDocs, null, 2)}

  // Please help me find a solution for this guest case: ${prompt}

  // It's very important to check the communications history with the client first to identify if there have been any other cases related to these issues or other ones in the past.

  // Guest communications history: ${JSON.stringify(messagesMetadata, null, 2)}
  // Guest conversations history (channelId 1007 is referred to Whatsapp): ${JSON.stringify(threadsMetadata, null, 2)}

  // Format your response in this structure:
  // 1. **Sources**: List the specific SOP documents from the provided JSON that you used to find the troubleshooting hints. Reference them by their titles.
  // 2. **Communications**: Brief description of the conversations with the client. If no specific mention of the related issues in the past, tell me briefly what prior conversations have been related to emphasizing and giving priority to previous conversations related to other issues managed.
  // 3. **Troubleshooting Steps**:
  //   - Step-by-step instructions
  //   - Include any specific checks needed

  // To give troubleshooting hints, always take guest's conversations and communications into consideration to detect if the same case or similar has happened before.`;
  const client = axios.create({
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  const params = {
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-4o-mini",
    max_completion_tokens: 100,
    temperature: 0,
  };

  try {
    const result = await client.post(
      "https://api.openai.com/v1/chat/completions",
      params,
    );
    const message = result.data.choices[0].message.content;
    // console.log(message);
    return message;
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    throw err;
  }
  // return {
  //   // messages: messagesMetadata,
  //   // threads: threadsMetadata,
  // };
};

async function getAssociatedContacts(hs_object_id) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  try {
    const apiResponse =
      await hubSpotClient.crm.associations.v4.basicApi.getPage(
        "tickets",
        hs_object_id,
        "contacts",
      );
    const associatedContacts = apiResponse.results;
    const contactIds = associatedContacts.map((contact) => contact.toObjectId);
    // console.log(JSON.stringify(contactIds, null, 2));
    return contactIds;
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
    return [];
  }
}

async function getAssociatedMessages(contactIds) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  try {
    const apiResponse =
      await hubSpotClient.crm.associations.v4.basicApi.getPage(
        "contacts",
        contactIds[0], // Use a single contact ID
        "engagements",
      );
    const associatedMessages = apiResponse.results;
    const engmIds = associatedMessages.map((message) => message.toObjectId);
    // console.log(JSON.stringify(associatedMessages, null, 2));
    // console.log(JSON.stringify(msgIds, null, 2));
    return engmIds;
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
  }
}

async function getEngagement(engagementId) {
  const url = `https://api.hubapi.com/engagements/v1/engagements/${engagementId}`;

  const headers = {
    accept: "application/json",
    authorization: `Bearer ${process.env["PRIVATE_APP_ACCESS_TOKEN"]}`,
  };

  try {
    const response = await axios.get(url, { headers });
    // console.log("Engagement data:", JSON.stringify(response.data, null, 2));
    // console.log(
    //   "#######################################################################",
    // );
    // console.log(
    //   "#######################################################################",
    // );
    return response.data;
  } catch (error) {
    console.error("Error fetching engagement:", error.message);
    throw error;
  }
}

async function getThread(threadId) {
  const url = `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`;
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${process.env["PRIVATE_APP_ACCESS_TOKEN"]}`,
  };

  try {
    const response = await axios.get(url, { headers });
    const data = response.data;
    const thread = data.results;
    // Filter only messages of type "MESSAGE"
    const messageThreads = thread.filter((msg) => msg.type === "MESSAGE");
    // console.log("Message Threads: ", JSON.stringify(messageThreads, null, 2));
    return messageThreads;
  } catch (error) {
    console.error("Error fetching thread:", error.message);
    throw error;
  }
}

// ################################### DOCX READER (SINGLE DOC) #######################################
// DOCX READER
/**
 * Reads a .docx file and extracts its content as HTML or plain text
 * @param {string} filePath - Path to the .docx file
 * @param {boolean} extractHtml - Whether to extract as HTML (true) or plain text (false)
 * @returns {Promise<{value: string, messages: Array}>} - The extracted content and any warning messages
 */
async function readDocxFile(filePath, extractHtml = false) {
  try {
    // Read the file as a buffer
    const buffer = fs.readFileSync(filePath);

    // Convert the document using mammoth with the correct options format
    const result = extractHtml
      ? await mammoth.convertToHtml({ buffer: buffer })
      : await mammoth.extractRawText({ buffer: buffer });

    return {
      content: result.value,
      messages: result.messages,
    };
  } catch (error) {
    console.error("Error reading .docx file:", error);
    throw error;
  }
}

// Example usage
const fullPath = path.join(__dirname, "GX SOPs", "A_C Malfunction.docx");
// console.log("Attempting to read:", fullPath);
console.log("#################################################");
if (!fs.existsSync(fullPath)) {
  console.error("File does not exist:", fullPath);
  return;
}

// ################################### DOCX READER (FILES LIST) #######################################
const directoryPath = path.join(__dirname, "GX SOPs");

function getFilePaths(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilePaths(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// const loader = new DirectoryLoader(
//   "OpenAICard/openaiCard/src/app/app.functions/GX SOPs/Broken Bed.docx",
//   {
//     ".docx": (path) => new TextLoader(path, "/text"),
//   },
// );
// const docs = await loader.load();
