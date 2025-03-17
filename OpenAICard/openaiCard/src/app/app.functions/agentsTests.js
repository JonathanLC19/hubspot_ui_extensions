// Required imports
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const z = require("zod");
const fs = require("fs");
const issuesData = require("./issues.json");
const sopData = require("./GX SOPs/sop_documents.json"); // Import SOP documents

const hubspot = require("@hubspot/api-client");
const axios = require("axios");

dotenv.config();

// Function to create the issues search tool description for OpenAI
function createIssuesToolDescription() {
  return {
    type: "function",
    function: {
      name: "search_customer_service_issues",
      description: "Search and filter customer service team issues",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description:
              "Type of issue or request (e.g., 'Apartment Info', 'City Info')",
          },
          tier: {
            type: "string",
            enum: ["Tier 1", "Tier 2", "Tier 3"],
            description: "Complexity level of the issue",
          },
          severity: {
            type: "string",
            enum: ["Cosmetic", "Minor", "Major", "Critical"],
            description: "Severity of the issue",
          },
          priority: {
            type: "string",
            enum: ["Low", "Medium", "High", "Urgent"],
            description: "Priority for attention",
          },
          query: {
            type: "string",
            description: "Text to search for in issue descriptions",
          },
        },
        required: [],
      },
    },
  };
}

// Function to create the SOP search tool description for OpenAI
function createSOPToolDescription() {
  return {
    type: "function",
    function: {
      name: "find_applicable_sops",
      description:
        "Find standard operating procedures applicable to a specific issue",
      parameters: {
        type: "object",
        properties: {
          issueType: {
            type: "string",
            description:
              "Type of issue to find SOPs for (e.g., 'Bad Smell', 'No Hot Water')",
          },
          category: {
            type: "string",
            description:
              "Category of SOPs to search for (e.g., 'complaints', 'maintenance')",
          },
          query: {
            type: "string",
            description: "Text to search for in SOP content",
          },
        },
        required: [],
      },
    },
  };
}

function searchIssues(args) {
  return issuesData.filter((issue) => {
    const matches = [];

    if (args.type) {
      matches.push(issue.type.toLowerCase().includes(args.type.toLowerCase()));
    }
    if (args.tier) {
      matches.push(issue.tier === args.tier);
    }
    if (args.severity) {
      matches.push(issue.severity === args.severity);
    }
    if (args.priority) {
      matches.push(issue.priority === args.priority);
    }
    if (args.query) {
      matches.push(
        issue.description.toLowerCase().includes(args.query.toLowerCase()),
      );
    }

    return matches.length > 0 ? matches.every((match) => match) : true;
  });
}

function findSOPs(args) {
  return sopData.filter((sop) => {
    const matches = [];

    if (args.issueType) {
      matches.push(
        sop.issueType.toLowerCase().includes(args.issueType.toLowerCase()),
      );
    }
    if (args.category) {
      matches.push(
        sop.category.toLowerCase().includes(args.category.toLowerCase()),
      );
    }
    if (args.query) {
      matches.push(
        sop.content.toLowerCase().includes(args.query.toLowerCase()),
      );
    }

    return matches.length > 0 ? matches.every((match) => match) : true;
  });
}

// Add the main function before the module check
async function issueAgent() {
  const issues = issuesData;
  const tools = [createIssuesToolDescription(), createSOPToolDescription()];
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages = [
    {
      role: "system",
      content: `You are a helpful and expert guest service agent's consultant. Search on ${JSON.stringify(issues, null, 2)} and provide a list of issues that need to be addressed and hints to help the agent with next steps to solve the case. Stick into the tools added.`,
    },
    {
      role: "user",
      content:
        "One of the living room's windows is not closing well and there's a lot of cold coming from the street. Also would like to request a cleaning for next week",
    },
  ];

  // First call to get tool calls
  console.log("First Call...");
  const response = await client.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: messages,
    tools: tools,
  });

  // Handle tool calls
  if (response.choices[0].message.tool_calls) {
    const toolCalls = response.choices[0].message.tool_calls;
    messages.push(response.choices[0].message); // Add assistant's message
    console.log("Tool Calls:", toolCalls);

    // Add tool results to messages
    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      let toolResult;

      if (toolCall.function.name === "search_customer_service_issues") {
        toolResult = searchIssues(args);
      } else if (toolCall.function.name === "find_applicable_sops") {
        toolResult = findSOPs(args);
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(toolResult),
      });
      // console.log("Messages:", messages);
    }

    // Get final response
    const finalResponse = await client.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: messages,
    });

    console.log("Final Response:", finalResponse.choices[0].message.content);
  }
}

issueAgent();
