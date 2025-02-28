const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

exports.main = async (context = {}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  const client = axios.create({
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const { text } = context.parameters;
  console.log("Text received:", text);

  const issuesJson = JSON.stringify(issues);
  const prompt = `Lee este texto: "${text}" y busca en este JSON el tipo de issue, severity y priority al que se refiere en base a la descripción: ${issuesJson}. Responde solo con el tipo de issue, severity, priority y el sentimiento de la persona. Sigue esta estructura en la respuesta: "Type of Issue": tipo de issue al que se refiere / "Severity": / "Priority": / "Sentiment": `;

  const params = {
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-3.5-turbo-0125",
    max_tokens: 50,
    temperature: 0,
  };

  try {
    const response = await client.post(
      "https://api.openai.com/v1/chat/completions",
      params,
    );
    const message = response.data.choices[0].message.content;
    console.log("Response:", message);

    return {
      result: message,
    };
  } catch (err) {
    console.error(
      "Error fetching chat completion:",
      err.response ? err.response.data : err.message,
    );
    return { error: "Error fetching chat completion" };
  }
};

// const apiKey = process.env.OPENAI_API_KEY;

// const text = `I need information about check in instructions`
// const issuesJson = JSON.stringify(issues);
// const prompt = `Lee este texto: "${text}" y busca en este JSON el tipo de issue, severity y priority al que se refiere en base a la descripción: ${issuesJson}. Responde solo con el tipo de issue, severity, priority y el sentimiento de la persona. Sigue esta estructura en la respuesta: "Type of Issue": / "Severity": / "Priority": / "Sentiment": `;

// const client = axios.create({
//   headers: {
//     Authorization: `Bearer ${apiKey}`,
//     'Content-Type': 'application/json',
//   },
// });

// const params = {
//   messages: [
//     {
//       role: "user",
//       content: prompt
//     },
//   ],
//   model: "gpt-4o",
//   max_tokens: 50,
//   temperature: 0,
// };

// client
//   .post("https://api.openai.com/v1/chat/completions", params)
//   .then((result) => {
//     const message = result.data.choices[0].message.content
//     console.log(message);
//     return message;
//   })
//   .catch((err) => {
//     console.log(err.response ? err.response.data : err.message);
//   });
