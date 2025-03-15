// Required imports
const { OpenAI } = require("openai");
const z = require("zod");
const issuesData = require("./issues.json");
const sopData = require("./GX SOPs/sop_documents.json"); // Import SOP documents

// Define validation schema with Zod for issues
const IssueSchema = z.object({
  type: z.string().describe("Type of issue or request"),
  tier: z
    .enum(["Tier 1", "Tier 2", "Tier 3"])
    .describe("Complexity level of the issue"),
  severity: z
    .enum(["Cosmetic", "Minor", "Major", "Critical"])
    .describe("Severity of the issue"),
  priority: z
    .enum(["Low", "Medium", "High", "Urgent"])
    .describe("Priority for attention"),
  description: z
    .string()
    .describe("Detailed description of the issue or request"),
});

// Schema for the list of issues
const IssuesListSchema = z.array(IssueSchema);

// Define schema for SOPs based on the provided example
const SOPSchema = z.object({
  issueType: z.string().describe("Type of issue this SOP addresses"),
  category: z
    .string()
    .describe('Category the SOP belongs to (e.g., "complaints")'),
  content: z
    .string()
    .describe("Detailed instructions and procedures for handling the issue"),
});

// Schema for SOP list
const SOPListSchema = z.array(SOPSchema);

// Function to validate JSON data against schemas
function validateData() {
  try {
    const validatedIssues = IssuesListSchema.parse(issuesData);
    console.log(
      `Issues validation successful! Found ${validatedIssues.length} issues.`,
    );

    const validatedSOPs = SOPListSchema.parse(sopData);
    console.log(
      `SOPs validation successful! Found ${validatedSOPs.length} SOPs.`,
    );

    return { validatedIssues, validatedSOPs };
  } catch (error) {
    console.error("Validation error:", error.errors);
    return null;
  }
}

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

// Function to filter issues based on criteria
function filterIssues(criteria) {
  let filteredIssues = [...issuesData];

  if (criteria.type) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.type === criteria.type,
    );
  }

  if (criteria.tier) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.tier === criteria.tier,
    );
  }

  if (criteria.severity) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.severity === criteria.severity,
    );
  }

  if (criteria.priority) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.priority === criteria.priority,
    );
  }

  if (criteria.query) {
    const query = criteria.query.toLowerCase();
    filteredIssues = filteredIssues.filter((issue) =>
      issue.description.toLowerCase().includes(query),
    );
  }

  return filteredIssues;
}

// Function to find applicable SOPs for an issue
function findApplicableSOPs(params) {
  let applicableSOPs = [...sopData];

  if (params.issueType) {
    applicableSOPs = applicableSOPs.filter(
      (sop) => sop.issueType.toLowerCase() === params.issueType.toLowerCase(),
    );
  }

  if (params.category) {
    applicableSOPs = applicableSOPs.filter(
      (sop) => sop.category.toLowerCase() === params.category.toLowerCase(),
    );
  }

  if (params.query) {
    const query = params.query.toLowerCase();
    applicableSOPs = applicableSOPs.filter((sop) =>
      sop.content.toLowerCase().includes(query),
    );
  }

  return applicableSOPs;
}

// Function to extract key management steps from SOP content
function extractManagementSteps(sopContent) {
  // This is a simple implementation - in a real-world scenario,
  // you might want to use more sophisticated NLP techniques

  // Look for sections that likely contain action steps
  const sections = [
    {
      title: "Immediate Actions",
      regex: /Immediate Actions|Suggest Immediate Actions/i,
    },
    {
      title: "Troubleshooting Steps",
      regex: /Troubleshooting Steps|Remote Troubleshooting Steps/i,
    },
    {
      title: "Potential Solutions",
      regex: /Potential Solutions|Provide Potential Solutions/i,
    },
    {
      title: "Communication",
      regex: /Communication|Communication and Follow-Up/i,
    },
    { title: "Maintenance", regex: /Maintenance|Schedule Maintenance/i },
  ];

  const steps = {};

  for (const section of sections) {
    const match = sopContent.match(
      new RegExp(`${section.regex.source}([\\s\\S]*?)(?=\\d\\.\\s|$)`, "i"),
    );
    if (match && match[1]) {
      // Extract bullet points or numbered items
      const items = match[1]
        .split(/\n\s*(?:\d+\.\s*|\*\s*)/)
        .filter((item) => item.trim().length > 0);
      steps[section.title] = items.map((item) => item.trim());
    }
  }

  return steps;
}

// OpenAI client configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Main function to process a customer query through two agents
async function processCustomerQuery(userQuery) {
  try {
    // FIRST AGENT: Find relevant issues
    console.log("STAGE 1: Finding relevant issues...");
    const issueTools = [createIssuesToolDescription()];

    const issueResponse = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content:
            "You are an agent that identifies relevant customer service issues based on user queries. Use the available tool to search and filter issues. Try to identify the most specific issue type that matches the query.",
        },
        { role: "user", content: userQuery },
      ],
      tools: issueTools,
      tool_choice: "auto",
    });

    const issueMessage = issueResponse.choices[0].message;
    let relevantIssues = [];
    let issueTypes = new Set();

    // Process tool calls to get relevant issues
    if (issueMessage.tool_calls) {
      for (const toolCall of issueMessage.tool_calls) {
        if (toolCall.function.name === "search_customer_service_issues") {
          const args = JSON.parse(toolCall.function.arguments);
          relevantIssues = filterIssues(args);

          // Extract issue types for SOP lookup
          relevantIssues.forEach((issue) => {
            issueTypes.add(issue.type);
          });

          console.log(`Found ${relevantIssues.length} relevant issues`);
        }
      }

      // If no issues found, return early
      if (relevantIssues.length === 0) {
        // Try to extract possible issue type from the query
        const extractIssueTypeResponse = await openai.chat.completions.create({
          model: "gpt-4-0125-preview",
          messages: [
            {
              role: "system",
              content:
                "Extract the most likely issue type from the user query. Return ONLY the issue type, nothing else.",
            },
            { role: "user", content: userQuery },
          ],
        });

        const possibleIssueType =
          extractIssueTypeResponse.choices[0].message.content.trim();
        issueTypes.add(possibleIssueType);
      }
    } else {
      // If no tool was called, extract possible issue type directly
      const extractIssueTypeResponse = await openai.chat.completions.create({
        model: "gpt-4-0125-preview",
        messages: [
          {
            role: "system",
            content:
              "Extract the most likely issue type from the user query. Return ONLY the issue type, nothing else.",
          },
          { role: "user", content: userQuery },
        ],
      });

      const possibleIssueType =
        extractIssueTypeResponse.choices[0].message.content.trim();
      issueTypes.add(possibleIssueType);
    }

    // SECOND AGENT: Find applicable SOPs and management options
    console.log("STAGE 2: Finding applicable SOPs and management options...");
    const sopTools = [createSOPToolDescription()];

    let allApplicableSOPs = [];

    // For each identified issue type, find applicable SOPs
    for (const issueType of issueTypes) {
      const sopResponse = await openai.chat.completions.create({
        model: "gpt-4-0125-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an agent that provides management options based on Standard Operating Procedures (SOPs). Find the most relevant SOPs for the specified issue type.",
          },
          {
            role: "user",
            content: `Find SOPs applicable to issues of type: "${issueType}"`,
          },
        ],
        tools: sopTools,
        tool_choice: "auto",
      });

      const sopMessage = sopResponse.choices[0].message;

      // Process tool calls to get applicable SOPs
      if (sopMessage.tool_calls) {
        for (const toolCall of sopMessage.tool_calls) {
          if (toolCall.function.name === "find_applicable_sops") {
            const args = JSON.parse(toolCall.function.arguments);
            // If no issue type specified, use the one from our loop
            if (!args.issueType) {
              args.issueType = issueType;
            }
            const sops = findApplicableSOPs(args);
            allApplicableSOPs = [...allApplicableSOPs, ...sops];
            console.log(
              `Found ${sops.length} applicable SOPs for issue type "${issueType}"`,
            );
          }
        }
      }
    }

    // Remove duplicates from SOPs
    allApplicableSOPs = allApplicableSOPs.filter(
      (sop, index, self) =>
        index === self.findIndex((s) => s.issueType === sop.issueType),
    );

    // If we found applicable SOPs, extract management steps and generate final response
    if (allApplicableSOPs.length > 0) {
      // Extract key management steps from each SOP
      const managementOptions = allApplicableSOPs.map((sop) => {
        return {
          issueType: sop.issueType,
          category: sop.category,
          steps: extractManagementSteps(sop.content),
          rawContent: sop.content,
        };
      });

      // Generate final management recommendations
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4-0125-preview",
        messages: [
          {
            role: "system",
            content: `You are an agent that provides management options based on Standard Operating Procedures (SOPs). 
            Provide a clear, concise summary of how to handle the identified issues using the applicable SOPs.
            Focus on practical steps and actions that should be taken. Format your response in a clear, structured way.`,
          },
          {
            role: "user",
            content: `Based on the query: "${userQuery}", provide management options using these SOPs: ${JSON.stringify(managementOptions)}`,
          },
        ],
      });

      return finalResponse.choices[0].message.content;
    } else {
      return "No applicable SOPs found for the given query. Please provide more specific information about the issue type.";
    }
  } catch (error) {
    console.error("Error processing query:", error);
    return `Error: ${error.message}`;
  }
}

// Example usage
async function main() {
  // Example user query
  const userQuery =
    "A tenant reported a bad smell in their apartment. What should I do?";
  console.log(`Processing query: "${userQuery}"`);

  const response = await processCustomerQuery(userQuery);
  console.log("\nManagement options:");
  console.log(response);
}

// Execute the main program if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateData,
  createIssuesToolDescription,
  createSOPToolDescription,
  filterIssues,
  findApplicableSOPs,
  extractManagementSteps,
  processCustomerQuery,
};
