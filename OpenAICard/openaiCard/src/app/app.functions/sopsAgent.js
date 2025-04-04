// const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");
// const mammoth = require("mammoth");
// const fs = require("fs");
// const path = require("path");
// const exp = require("constants");
const hubspot = require("@hubspot/api-client");

// const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
// const { TextLoader } = require("langchain/document_loaders/fs/text");

dotenv.config();

// Entry function of this module, it fetches associated deals and calculates the statistics
exports.main = async (context = {}) => {
  const { hs_object_id } = context.parameters;

  // Comment out SOP reading
  // const docResult = await readDocxFile(fullPath);
  // const fileContent = docResult.content;

  // Keep all communications and messages fetching code
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
    assocs: msg.associations,
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
    // assocTicketId: msg.assocs,
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
  let ticketThread = [];
  const messagesWithThreads = messages.filter(
    (msg) => msg.metadata && msg.metadata.conversationsThreadId,
  );
  // console.log(
  //   "Messages With Threads: ",
  //   JSON.stringify(messagesWithThreads, null, 2),
  // );
  // const threadMsgs = JSON.stringify(messagesWithThreads, null, 2);
  // console.log("Thread Msgs: ", threadMsgs);

  const specificTicketId = Number(hs_object_id);
  const messagesForTicket = messagesWithThreads.filter(
    (msg) =>
      msg.associations &&
      Array.isArray(msg.associations.ticketIds) &&
      msg.associations.ticketIds.includes(specificTicketId),
  );

  // console.log(
  //   `Mensajes asociados al ticket ${specificTicketId}:`,
  //   JSON.stringify(messagesForTicket, null, 2),
  // );

  if (messagesWithThreads.length > 0) {
    const threadPromises = messagesWithThreads.map((msg) =>
      getThread(msg.metadata.conversationsThreadId),
    );
    threads = await Promise.all(threadPromises);
  }
  // console.log("Threads: ", JSON.stringify(threads, null, 2));

  if (messagesForTicket.length > 0) {
    const ticketThreadPromises = messagesForTicket.map((msg) =>
      getThread(msg.metadata.conversationsThreadId),
    );
    ticketThread = await Promise.all(ticketThreadPromises);
  }
  // console.log("Ticket Thread: ", JSON.stringify(ticketThread, null, 2));

  const flatThreads = threads.flat();
  // console.log("Flatted Threads: ", JSON.stringify(flatThreads, null, 2));
  const threadsMetadata = flatThreads.map((thr) => ({
    threadId: thr.conversationsThreadId,
    channelId: thr.channelId,
    direction: thr.direction,
    createdAt: thr.createdAt,
    text: thr.text
      .replace(/[^\w\s]/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));
  // console.log("Normalized Threads: ", JSON.stringify(threadsMetadata, null, 2));

  const ticketFlatThreads = ticketThread.flat();
  // console.log("Flatted Threads: ", JSON.stringify(flatThreads, null, 2));
  const ticketThreadsMetadata = ticketFlatThreads.map((thr) => ({
    threadId: thr.conversationsThreadId,
    channelId: thr.channelId,
    direction: thr.direction,
    createdAt: thr.createdAt,
    text: thr.text
      .replace(/[^\w\s]/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));
  console.log(
    "Normalized Current Ticket Threads: ",
    JSON.stringify(ticketThreadsMetadata, null, 2),
  );
  // ####################################################################################################

  // console.log("####################  SOP FILES #############################");
  // const filePaths = getFilePaths(directoryPath);
  // console.log(filePaths);

  // Get OpenAI API key from secrets
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not found in secrets");
  }
  const prompt = JSON.stringify(ticketThreadsMetadata, null, 2);
  // console.log("Question: ", prompt);
  // console.log("#################################################");

  // System prompt
  const system = `You are a helpful guest experience agent in an accomodation company.
  Analyze this case's conversation thread with the guest: ${prompt} and the complete communications history with the client.

  Current ticket thread: ${JSON.stringify(ticketThreadsMetadata, null, 2)}
  Previous communications:
  - Messages history: ${JSON.stringify(messagesMetadata, null, 2)}
  - Conversations history (channelId 1007 is referred to Whatsapp): ${JSON.stringify(threadsMetadata, null, 2)}

  Format your response in this structure:
  1. **Current Case Analysis**: 
  - Brief description of the current ticket's conversation thread and its context.
  2. **Previous Communications**: 
  - Summary of past interactions with the client, highlighting any relevant patterns or recurring topics.
  3. **Sentiment**: {Place the sentiment here}
  - The sentiment of the client about the case based on the tone of their messages. Choose from these options:
    - 😉 POSITVE
    - 😕 NEUTRAL
    - 😡 NEGATIVE
  4. **Proposed Message to the Client:**:
    - Provide a suggested message to send to the client to address their current case.`;

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
    max_tokens: 500,
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

// Comment out all SOP-related functions
/*
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
const fullPath = path.join(__dirname, "GX SOPs", "No water presssure.docx");
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
*/

// Keep all the communication-related functions
// const loader = new DirectoryLoader(
//   "OpenAICard/openaiCard/src/app/app.functions/GX SOPs/Broken Bed.docx",
//   {
//     ".docx": (path) => new TextLoader(path, "/text"),
//   },
// );
// const docs = await loader.load();
