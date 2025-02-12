// for HubSpot API calls
const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });
  const { workOrderDescription } = context.parameters; // Cambiar woDescription por workOrderDescription
  const { hs_object_id } = context.propertiesToSend;

  const apiResponse = await hubspotClient.crm.tickets.basicApi.update(
    hs_object_id,
    {
      properties: {
        work_order_description: workOrderDescription || "" // Asegurarnos que no es undefined
      }
    }
  );

  return apiResponse;
};
