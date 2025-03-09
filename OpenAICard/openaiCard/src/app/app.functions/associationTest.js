const hubspot = require("@hubspot/api-client");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const HS_API_KEY = process.env.PRIVATE_APP_ACCESS_TOKEN;

const hubspotClient = new hubspot.Client({
  accessToken: HS_API_KEY,
});

const objectType = "tickets";
const objectId = "95462768826";
const toObjectType = "contacts";
const after = undefined;
const limit = 500;

async function getAssociatedContacts() {
  try {
    const apiResponse =
      await hubspotClient.crm.associations.v4.basicApi.getPage(
        objectType,
        objectId,
        toObjectType,
        after,
        limit,
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
  try {
    const apiResponse =
      await hubspotClient.crm.associations.v4.basicApi.getPage(
        "contacts",
        contactIds[0], // Use a single contact ID
        "engagements",
        after,
        limit,
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
    authorization: `Bearer ${HS_API_KEY}`,
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
    authorization: `Bearer ${HS_API_KEY}`,
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

async function main() {
  const contactIds = await getAssociatedContacts();
  const engmIds = await getAssociatedMessages(contactIds);
  let messages = [];
  if (engmIds.length > 0) {
    const messagePromises = engmIds.map((id) => getEngagement(id));
    messages = await Promise.all(messagePromises);
  }
  // console.log("Messages: ", JSON.stringify(messages, null, 2));
  let communications = [];
  const messagesNoThreads = messages.filter(
    (msg) => msg.metadata && !msg.metadata.conversationsThreadId,
  );
  if (messagesNoThreads.length > 0) {
    communications = messagesNoThreads;
  }
  // console.log("Communications: ", JSON.stringify(communications, null, 2));
  let threads = [];
  // Filter messages that have conversationsThreadId in metadata
  const messagesWithThreads = messages.filter(
    (msg) => msg.metadata && msg.metadata.conversationsThreadId,
  );
  if (messagesWithThreads.length > 0) {
    const threadPromises = messagesWithThreads.map((msg) =>
      getThread(msg.metadata.conversationsThreadId),
    );
    threads = await Promise.all(threadPromises);
  }
  console.log("Threads: ", JSON.stringify(threads, null, 2));
}

main();
