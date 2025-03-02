const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const exp = require("constants");
dotenv.config();

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

exports.main = async (context = {}) => {
  const docResult = await readDocxFile(fullPath);
  const fileContent = docResult.content;

  const apiKey = process.env.OPENAI_API_KEY;
  const { prompt } = context.parameters;
  console.log("Question: ", prompt);
  console.log("#################################################");
  const system = `Read this text related to guest experience team S.O.P.: ${fileContent} and answer this question: ${prompt}. Always use the text content to answer the question. make sure your response doesn't exceed the maximum number of tokens.`;

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

// async function main() {
//   try {
//     const docResult = await readDocxFile(fullPath);
//     const fileContent = docResult.content;

//     const apiKey = process.env.OPENAI_API_KEY;
//     const prompt = `What steps should I follow to troubleshoot an A-C malfunction issue?`;
//     console.log("Question: ", prompt);
//     console.log("#################################################");
//     const system = `Read this text related to guest experience team S.O.P.: ${fileContent} and answer this question: ${prompt}. Always use the text content to answer the question. make sure your response doesn't exceed the maximum number of tokens.`;

//     const client = axios.create({
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const params = {
//       messages: [
//         {
//           role: "system",
//           content: system,
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       model: "gpt-4o",
//       max_tokens: 200,
//       temperature: 0,
//     };

//     const result = await client.post(
//       "https://api.openai.com/v1/chat/completions",
//       params,
//     );
//     const message = result.data.choices[0].message.content;
//     console.log(message);
//     return message;
//   } catch (err) {
//     console.error(err.response ? err.response.data : err.message);
//   }
// }

// main();
