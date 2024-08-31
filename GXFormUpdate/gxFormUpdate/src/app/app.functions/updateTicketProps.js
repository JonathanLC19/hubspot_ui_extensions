const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
  const { prop_name, prop_value, ticketId } = context.parameters;

  const hubspotClient = new hubspot.Client({ accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN });

  const properties = {
    [prop_name]: prop_value,
  };
  const SimplePublicObjectInput = { properties };
  const idProperty = undefined;

  try {
    const apiResponse = await hubspotClient.crm.tickets.basicApi.update(
      ticketId,
      SimplePublicObjectInput,
      idProperty
    );
    console.log(JSON.stringify(apiResponse, null, 2));
    return {
      status: "SUCCESS",
      body: JSON.stringify(apiResponse),
    };
  } catch (e) {
    console.error(e.message === "HTTP request failed" ? JSON.stringify(e.response, null, 2) : e);
    return {
      status: "ERROR",
      body: JSON.stringify(e),
    };
  }
};
