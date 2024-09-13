const dotenv = require("dotenv");
const { Client } = require("@hubspot/api-client");
const axios = require("axios");

dotenv.config({ path: "./src/app/app.functions/.env.metabaseCard" });

exports.main = async (context = {}) => {
  console.log("Function started at:", new Date().toISOString());

  const PRIVATE_APP_ACCESS_TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;
  const METABASE_URL = process.env.METABASE_URL;
  const METABASE_USER = process.env.METABASE_USER;
  const METABASE_PASSWORD = process.env.METABASE_PASSWORD;

  console.log("Environment variables:", {
    PRIVATE_APP_ACCESS_TOKEN: PRIVATE_APP_ACCESS_TOKEN ? "Set" : "Not set",
    METABASE_URL: METABASE_URL ? "Set" : "Not set",
    METABASE_USER: METABASE_USER ? "Set" : "Not set",
    METABASE_PASSWORD: METABASE_PASSWORD ? "Set" : "Not set",
  });

  try {
    // Metabase authentication
    console.log("Authenticating with Metabase...");
    const authResponse = await axios.post(`${METABASE_URL}/api/session`, {
      username: METABASE_USER,
      password: METABASE_PASSWORD,
    });
    console.log("Metabase authentication completed at:", new Date().toISOString());

    const token = authResponse.data.id;
    const headers = { "X-Metabase-Session": token };

    // Use the correct card ID
    const cardId = 5323;

    // First, fetch the card definition
    console.log(`Fetching Gaps card ${cardId} definition...`);
    const cardResponse = await axios.get(`${METABASE_URL}/api/card/${cardId}`, { headers });
    console.log("Card definition received at:", new Date().toISOString());

    // Now, execute the query
    console.log(`Executing query for Gaps card ${cardId}...`);
    const queryResponse = await axios.post(
      `${METABASE_URL}/api/card/${cardId}/query`,
      {},
      { headers }
    );
    console.log("Gapos query results received at:", new Date().toISOString());

    const res = queryResponse.data;

    // Check if res has the expected structure
    if (!res || !Array.isArray(res.data.rows) || !Array.isArray(res.data.cols)) {
      throw new Error("Unexpected Gaps query result structure");
    }

    const rows = res.data.rows;
    const cols = res.data.cols.map((col) => col.name);

    console.log("Columns:", cols);

    // Return all Metabase card data
    const result = {
      columnNames: cols,
      data: rows,
    };
    console.log("Returning all Gaps card data:", JSON.stringify(result, null, 2));
    return { metabaseData: result };
  } catch (e) {
    console.error("Error in getApartmentGaps:", e.message);
    console.error("Error occurred at:", new Date().toISOString());
    console.error("Full error object:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Error processing Gaps data: ${e.message}` };
  }
};
