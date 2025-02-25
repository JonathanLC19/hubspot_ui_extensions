// for HubSpot API calls
const hubspot = require("@hubspot/api-client");

// Initialize HubSpot API client

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  const apiResponse = await hubspotClient.crm.properties.coreApi.getByName(
    "0-5",
    "all_issue_type__cloned_"
  );

  // Transform the options into the correct format for the Select component
  const options = apiResponse.options.map(option => ({
    label: option.label,
    value: option.value
  }));

  return {
    options: options
  };
};
