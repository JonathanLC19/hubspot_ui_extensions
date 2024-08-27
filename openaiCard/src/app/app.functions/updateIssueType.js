// for HubSpot API calls
const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  const { issueType } = context.parameters;
  const { hs_object_id } = context.propertiesToSend;

  // Set issue_type to empty string to clear the property
  await hubspotClient.crm.tickets.basicApi.update(hs_object_id, {
    properties: { issue_type: "" },
  });

  const apiResponse = await hubspotClient.crm.tickets.basicApi.update(
    hs_object_id,
    {
      properties: { issue_type: issueType },
    },
  );

  return apiResponse;
};
