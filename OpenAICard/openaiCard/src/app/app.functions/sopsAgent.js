const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const exp = require("constants");
const hubspot = require("@hubspot/api-client");

dotenv.config();

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
console.log("Attempting to read:", fullPath);
console.log("#################################################");
if (!fs.existsSync(fullPath)) {
  console.error("File does not exist:", fullPath);
  return;
}
// readDocxFile(fullPath)
//   .then((result) => {
//     console.log("Document content:", result.content);
//   })
//   .catch((error) => {
//     console.error("Failed to read document:", error);
//   });

// Function to fetch associated contacts with their properties
async function getAssociatedContacts(hs_object_id) {
  const hubSpotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  // Fetch assisocisated deals ids
  const objectData = await hubSpotClient.crm.tickets.basicApi.getById(
    hs_object_id,
    null,
    null,
    ["deals"],
  );
  if (!objectData.associations) {
    // No associated deals
    return [];
  }

  const contactIds = objectData.associations.contacts.results.map(
    (deal) => deal.id,
  );
  // Fetch more deals prooperties to calculate needed numbers
  const contacts = await hubSpotClient.crm.contacts.batchApi.read({
    inputs: contactIds.map((id) => ({ id })),
  });
  return contacts.results;
}

// OPENAI AGENT
exports.main = async (context = {}) => {
  // const { hs_object_id } = context.propertiesToSend;

  // const contacts = await getAssociatedContacts(hs_object_id);
  // console.log(
  //   "Contacts in sopsAgent file: ",
  //   JSON.stringify(contacts, null, 2),
  // );

  const docResult = await readDocxFile(fullPath);
  const fileContent = docResult.content;

  const apiKey = process.env.OPENAI_API_KEY;
  const { prompt } = context.parameters;
  console.log("Question: ", prompt);
  console.log("#################################################");
  const system = `Read this text related to guest experience team S.O.P.: ${fileContent} and answer this question: ${prompt}. 
    Format your response in this structure:
    1. **Problem Identification**: Brief description of the issue
    2. **Initial Assessment**: Key points to check first
    3. **Troubleshooting Steps**: 
       - Step-by-step instructions
       - Include any specific checks needed
    4. **Escalation Protocol**: When to escalate the issue
    
    Always use the text content to answer the question and maintain this exact formatting. Make sure your response doesn't exceed the maximum number of tokens.`;

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
    model: "gpt-4o",
    max_tokens: 200,
    temperature: 0,
  };
  try {
    const result = await client.post(
      "https://api.openai.com/v1/chat/completions",
      params,
    );
    const message = result.data.choices[0].message.content;
    console.log(message);
    return message;
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
};
