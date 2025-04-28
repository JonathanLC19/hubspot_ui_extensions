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
  try {
    const { hs_object_id, source_type, content } = context.parameters;

    // Verify HubSpot token first
    const hubspotToken = process.env.PRIVATE_APP_ACCESS_TOKEN;
    if (!hubspotToken) {
      throw new Error("HubSpot token not found in environment");
    }

    // Verify OpenAI token
    const openaiToken = process.env.OPENAI_API_KEY;
    if (!openaiToken) {
      throw new Error("OpenAI API key not found in environment");
    }

    // Log verification status
    console.log("API Keys Verification:", {
      hubspot: !!hubspotToken,
      openai: !!openaiToken,
      hubspotPrefix: hubspotToken.substring(0, 8) + "...",
      openaiPrefix: openaiToken.substring(0, 8) + "...",
    });

    // Log the received source and content
    console.log("Ticket Source:", source_type);
    console.log("Ticket Content:", content);

    // Test HubSpot token with a simple API call
    const hubSpotClient = new hubspot.Client({ accessToken: hubspotToken });
    await hubSpotClient.crm.contacts.basicApi.getPage();

    // Add logging for API keys verification
    console.log(
      "HubSpot Token available:",
      !!process.env.PRIVATE_APP_ACCESS_TOKEN,
    );
    console.log("OpenAI Token available:", !!process.env.OPENAI_API_KEY);
    console.log(
      "HubSpot Token prefix:",
      process.env.PRIVATE_APP_ACCESS_TOKEN?.substring(0, 8) + "...",
    );
    console.log(
      "OpenAI Token prefix:",
      process.env.OPENAI_API_KEY?.substring(0, 8) + "...",
    );

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

    // Current ticket messages - Fixed filtering
    const currentTicketMessages = messages.filter((msg) => {
      return (
        msg.associations &&
        Array.isArray(msg.associations.ticketIds) &&
        msg.associations.ticketIds.includes(Number(hs_object_id)) // Convert to number for comparison
      );
    });

    // console.log("Ticket ID being searched:", Number(hs_object_id));
    // console.log(
    //   "Current Ticket Messages:",
    //   JSON.stringify(currentTicketMessages, null, 2),
    // );

    // Normalized Current Ticket Messages
    const normalizedCurrentTicketMessages = currentTicketMessages.map(
      (msg) => ({
        assocs: msg.associations,
        // engagement: msg.engagement,
        type: msg.engagement.type,
        // direction: msg.direction,
        createdAt: msg.engagement.createdAt,
        // bodyPreview: msg.engagement.bodyPreview,
        text: msg.metadata.text
          ? msg.metadata.text
              .replace(/[^\w\s]/g, "")
              .replace(/\n/g, " ")
              .replace(/\s+/g, " ")
              .trim()
          : "",
      }),
    );

    // console.log(
    //   "Normalized Current Ticket Messages: ",
    //   JSON.stringify(normalizedCurrentTicketMessages, null, 2),
    // );

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

    // console.log(
    //   "Messages Metadata: ",
    //   JSON.stringify(messagesMetadata, null, 2),
    // );

    const messageTypes = [...new Set(messagesMetadata.map((msg) => msg.type))];
    // console.log("Message Types:", messageTypes);

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
    const threadMsgs = JSON.stringify(messagesWithThreads, null, 2);
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
    // console.log(
    //   "Normalized Threads: ",
    //   JSON.stringify(threadsMetadata, null, 2),
    // );

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
    // console.log(
    //   "Normalized Current Ticket Threads: ",
    //   JSON.stringify(ticketThreadsMetadata, null, 2),
    // );
    // ####################################################################################################

    const threadChannels = [
      {
        id: "1000",
        name: "LIVE_CHAT",
      },
      {
        id: "1001",
        name: "FB_MESSENGER",
      },
      {
        id: "1002",
        name: "EMAIL",
      },
      {
        id: "1003",
        name: "FORMS",
      },
      {
        id: "1004",
        name: "CUSTOMER_PORTAL_THREAD_VIEW",
      },
      {
        id: "1007",
        name: "WHATSAPP",
      },
      {
        id: "1008",
        name: "CALL",
      },
      {
        id: "1009",
        name: "SMS",
      },
      {
        id: "917161",
        name: "SMS with Aircall",
      },
    ];

    const channelNames = threadChannels.map((channel) => channel.name);

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
    ${source_type === "GUEST PORTAL" || source_type === "CONTACT US PAGE" 
      ? `Initial ticket content from ${source_type}: ${content}\n` 
      : ""}
    Analyze this case's conversation thread with the guest: ${prompt} and the complete communications history with the client.
    
    Current ticket conversations: ${JSON.stringify(ticketThreadsMetadata, null, 2)} and/or ${JSON.stringify(
      normalizedCurrentTicketMessages,
      null,
      2,
    )}
    Previous communications:
    - Messages history: ${JSON.stringify(messagesMetadata, null, 2)} .
    - Conversations history: ${JSON.stringify(threadsMetadata, null, 2)}

    Format your response in this structure:
    1. **Sentiment**: {Place the sentiment here if applies}
      The sentiment of the client about the case based on the tone of their messages. 
      If there are no current ticket conversations available to analyze, just say that sentiment doesn't apply for this ticket because no conversation has been identified. 
      Choose from these options:
        😉 POSITVE
        😕 NEUTRAL
        😡 NEGATIVE

    2. **Current Case Analysis**: 
      ${source_type === "GUEST PORTAL" || source_type === "CONTACT US PAGE" 
        ? "Start with analyzing the initial ticket content, then proceed with " 
        : ""}Brief description of the current ticket's conversations and its context.
    3. **Previous Communications**: 
      Summary of Messages history and Conversations history, that refers to past interactions with the client, highlighting any relevant patterns or recurring topics.
    4. **Channels Used**:
      Use the values from ${messageTypes} to identify and give a short description of the channels used for the previous communications. 
    `;

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
  } catch (error) {
    console.error("Serverless function error:", error);
    return {
      status: "error",
      error: error.message,
      details: error.response?.data || "No additional details available",
    };
  }
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
    if (!response.data || !response.data.results) {
      console.error("Invalid thread response format:", response.data);
      return [];
    }

    const thread = response.data.results;
    // Filter only messages of type "MESSAGE"
    const messageThreads = thread.filter((msg) => msg.type === "MESSAGE");
    console.log(`Thread ${threadId} messages count:`, messageThreads.length);
    return messageThreads;
  } catch (error) {
    console.error("Error fetching thread:", {
      threadId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message,
      details: error.response?.data,
    });
    // Return empty array instead of throwing to prevent cascade failures
    return [];
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
