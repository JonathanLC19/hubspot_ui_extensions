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

    // Get associated tickets and work orders
    const ticketIds = await getAssociatedTickets(hs_object_id);
    console.log("Ticket IDs:", ticketIds);
    const workOrderIds = await getAssociatedWOs(hs_object_id);
    console.log("Work Order IDs:", workOrderIds);

    // Fetch associated tickets info
    let associatedTickets = [];
    if (ticketIds.length > 0) {
      const ticketPromises = ticketIds.map((id) => searchTickets(id));
      associatedTickets = await Promise.all(ticketPromises);
      console.log("Associated Tickets:", associatedTickets);
    }
    // Fetch associated work orders info
    let associatedWOs = [];
    if (workOrderIds.length > 0) {
      const workOrderPromises = workOrderIds.map((id) => searchWOs(id));
      associatedWOs = await Promise.all(workOrderPromises);
      console.log("Associated Work Orders:", associatedWOs);
    }

    const noteIds = await getNotesIds(workOrderIds);
    let notes = [];
    if (noteIds.length > 0) {
      const notePromises = noteIds.map((id) => readNotes(id));
      notes = await Promise.all(notePromises);
    }
    console.log("Notes: ", JSON.stringify(notes, null, 2));

    const taskIds = await getTasksIds(workOrderIds);
    let tasks = [];
    if (taskIds.length > 0) {
      const taskPromises = taskIds.map((id) => readTasks(id));
      tasks = await Promise.all(taskPromises);
    }
    console.log("Tasks: ", JSON.stringify(tasks, null, 2));

    // Return the data
    return {
      status: "SUCCESS",
      response: {
        associatedTickets: associatedTickets.filter(Boolean),
        associatedWOs: associatedWOs.filter(Boolean),
        // associatedWONotes: associatedWONotes.filter(Boolean),
      },
    };
  } catch (error) {
    console.error("Serverless function error:", error);
    return {
      status: "error",
      error: error.message,
      details: error.response?.data || "No additional details available",
    };
  }
};

async function getAssociatedTickets(hs_object_id) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  try {
    const apiResponse =
      await hubSpotClient.crm.associations.v4.basicApi.getPage(
        "tickets",
        hs_object_id,
        "tickets",
      );
    const associatedTickets = apiResponse.results;
    const ticketIds = associatedTickets.map((ticket) => ticket.toObjectId);
    // console.log(JSON.stringify(contactIds, null, 2));
    return ticketIds;
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
    return [];
  }
}

async function getAssociatedWOs(hs_object_id) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  try {
    const apiResponse =
      await hubSpotClient.crm.associations.v4.basicApi.getPage(
        "tickets",
        hs_object_id,
        "2-134296003",
      );
    const AssociatedWOs = apiResponse.results;
    const WOIds = AssociatedWOs.map((workorder) => workorder.toObjectId);
    // console.log(JSON.stringify(contactIds, null, 2));
    return WOIds;
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
    return [];
  }
}

async function searchTickets(ticketId) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  const PublicObjectSearchRequest = {
    properties: [
      "subject",
      "hs_pipeline",
      "hs_pipeline_stage",
      "hubspot_owner_id",
      "all_issue_type__cloned_",
    ],
    filterGroups: [
      {
        filters: [
          {
            propertyName: "hs_object_id",
            value: ticketId,
            operator: "EQ",
          },
        ],
      },
    ],
  };

  try {
    const apiResponse = await hubSpotClient.crm.tickets.searchApi.doSearch(
      PublicObjectSearchRequest,
    );
    // console.log(JSON.stringify(apiResponse, null, 2));
    return apiResponse.results[0];
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
  }
}

async function searchWOs(WOId) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  const PublicObjectSearchRequest = {
    properties: [
      "work_order_name",
      "hs_pipeline",
      "hs_pipeline_stage",
      "hubspot_owner_id",
      "issue_type",
    ],
    filterGroups: [
      {
        filters: [
          {
            propertyName: "hs_object_id",
            value: WOId,
            operator: "EQ",
          },
        ],
      },
    ],
  };

  try {
    const apiResponse = await hubSpotClient.crm.objects.searchApi.doSearch(
      "2-134296003",
      PublicObjectSearchRequest,
    );
    // console.log(JSON.stringify(apiResponse, null, 2));
    return apiResponse.results[0];
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

async function getNotesIds(WOIds) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  try {
    if (!WOIds || !Array.isArray(WOIds) || WOIds.length === 0) {
      console.log("No Work Order IDs provided or invalid input");
      return [];
    }

    // Get notes for all work orders
    const notesPromises = WOIds.map(async (WOId) => {
      try {
        const apiResponse =
          await hubSpotClient.crm.associations.v4.basicApi.getPage(
            "2-134296003",
            WOId,
            "notes",
          );
        return apiResponse.results.map((message) => message.toObjectId);
      } catch (e) {
        console.error(`Error getting notes for WO ${WOId}:`, e);
        return [];
      }
    });

    const allNotes = await Promise.all(notesPromises);
    // Flatten the array of arrays and remove duplicates
    return [...new Set(allNotes.flat())];
  } catch (e) {
    console.error("Error in getNotesIds:", e);
    if (e.message === "HTTP request failed") {
      console.error(JSON.stringify(e.response, null, 2));
    }
    return [];
  }
}

async function readNotes(noteId) {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  const properties = ["hs_note_body", "hubspot_owner_id", "hs_timestamp"];
  const propertiesWithHistory = undefined;
  const associations = undefined;
  const archived = false;
  const idProperty = undefined;

  try {
    const apiResponse = await hubspotClient.crm.objects.notes.basicApi.getById(
      noteId,
      properties,
      propertiesWithHistory,
      associations,
      archived,
      idProperty,
    );
    return apiResponse;
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

async function getTasksIds(WOIds) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  try {
    if (!WOIds || !Array.isArray(WOIds) || WOIds.length === 0) {
      console.log("No Work Order IDs provided or invalid input");
      return [];
    }

    // Get notes for all work orders
    const notesPromises = WOIds.map(async (WOId) => {
      try {
        const apiResponse =
          await hubSpotClient.crm.associations.v4.basicApi.getPage(
            "2-134296003",
            WOId,
            "tasks",
          );
        return apiResponse.results.map((message) => message.toObjectId);
      } catch (e) {
        console.error(`Error getting notes for WO ${WOId}:`, e);
        return [];
      }
    });

    const allNotes = await Promise.all(notesPromises);
    // Flatten the array of arrays and remove duplicates
    return [...new Set(allNotes.flat())];
  } catch (e) {
    console.error("Error in getNotesIds:", e);
    if (e.message === "HTTP request failed") {
      console.error(JSON.stringify(e.response, null, 2));
    }
    return [];
  }
}

async function readTasks(taskId) {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  const properties = [
    "hs_task_subject",
    "hs_task_body",
    "hs_task_status",
    "hubspot_owner_id",
    "hs_timestamp",
  ];
  const propertiesWithHistory = undefined;
  const associations = undefined;
  const archived = false;
  const idProperty = undefined;

  try {
    const apiResponse = await hubspotClient.crm.objects.tasks.basicApi.getById(
      taskId,
      properties,
      propertiesWithHistory,
      associations,
      archived,
      idProperty,
    );
    return apiResponse;
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
  }
}

// async function getThread(threadId) {
//   const url = `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`;
//   const headers = {
//     accept: "application/json",
//     authorization: `Bearer ${process.env["PRIVATE_APP_ACCESS_TOKEN"]}`,
//   };

//   try {
//     const response = await axios.get(url, { headers });
//     if (!response.data || !response.data.results) {
//       console.error("Invalid thread response format:", response.data);
//       return [];
//     }

//     const thread = response.data.results;
//     // Filter only messages of type "MESSAGE"
//     const messageThreads = thread.filter((msg) => msg.type === "MESSAGE");
//     console.log(`Thread ${threadId} messages count:`, messageThreads.length);
//     return messageThreads;
//   } catch (error) {
//     console.error("Error fetching thread:", {
//       threadId,
//       status: error.response?.status,
//       statusText: error.response?.statusText,
//       error: error.message,
//       details: error.response?.data,
//     });
//     // Return empty array instead of throwing to prevent cascade failures
//     return [];
//   }
// }
