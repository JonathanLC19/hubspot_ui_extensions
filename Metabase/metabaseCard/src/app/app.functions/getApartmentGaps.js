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

  const { backoffice_id } = context.parameters;
  console.log(`Looking up deal by backoffice_id: [${backoffice_id}]`);

  if (!backoffice_id) {
    console.error("backoffice_id is missing");
    return { error: "backoffice_id is missing" };
  }

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
    const cardId = 1876;

    // First, fetch the card definition
    console.log(`Fetching Metabase card ${cardId} definition...`);
    const cardResponse = await axios.get(`${METABASE_URL}/api/card/${cardId}`, { headers });
    console.log("Card definition received at:", new Date().toISOString());

    // Now, execute the query
    console.log(`Executing query for Metabase card ${cardId}...`);
    const queryResponse = await axios.post(
      `${METABASE_URL}/api/card/${cardId}/query`,
      {},
      { headers }
    );
    console.log("Query results received at:", new Date().toISOString());

    const res = queryResponse.data;

    // Check if res has the expected structure
    if (!res || !Array.isArray(res.data.rows) || !Array.isArray(res.data.cols)) {
      throw new Error("Unexpected Metabase query result structure");
    }

    const rows = res.data.rows;
    const cols = res.data.cols.map((col) => col.name);

    console.log("Columns:", cols);

    // Find the index of the "id" column
    const idColumnIndex = cols.findIndex((col) => col.toLowerCase() === "id");

    if (idColumnIndex === -1) {
      console.error("No 'id' column found. Available columns:", cols);
      throw new Error("No suitable ID column found in Metabase data");
    }

    console.log("Using column for ID:", cols[idColumnIndex]);
    console.log("Searching for backoffice_id:", backoffice_id);

    // Log all IDs in the data
    console.log(
      "All IDs in Metabase data:",
      rows.map((row) => row[idColumnIndex])
    );

    // Find the row with matching backoffice_id
    const matchingRow = rows.find((row) => {
      const idValue = row[idColumnIndex];
      console.log("Comparing:", idValue, "with", backoffice_id);
      return idValue && idValue.toString() === backoffice_id;
    });

    if (matchingRow) {
      const result = {
        hubspotBackofficeId: backoffice_id,
        metabaseId: matchingRow[idColumnIndex],
        columnNames: cols,
        data: [matchingRow],
      };
      console.log("Returning result:", JSON.stringify(result, null, 2));
      return { metabaseData: result };
    } else {
      console.error("No matching row found for backoffice_id:", backoffice_id);
      console.log("Sample data (first 5 rows):", JSON.stringify(rows.slice(0, 5), null, 2));
      return { error: "No matching ID found in Metabase data" };
    }
  } catch (e) {
    console.error("Error in getMetabaseData:", e.message);
    console.error("Error occurred at:", new Date().toISOString());
    console.error("Full error object:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return { error: `Error processing Metabase data: ${e.message}` };
  }
};
