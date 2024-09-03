const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
  const { prop_name, prop_value, ticketId } = context.parameters;

  const hubspotClient = new hubspot.Client({ accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN });

  const properties = {
    [prop_name]: prop_value,
  };
  const SimplePublicObjectInput = { properties };

  try {
    await hubspotClient.crm.tickets.basicApi.update(ticketId, SimplePublicObjectInput);

    // Fetch the updated ticket to get all properties
    const updatedTicket = await hubspotClient.crm.tickets.basicApi.getById(ticketId, ["*"]);

    console.log(JSON.stringify(updatedTicket, null, 2));
    return {
      status: "SUCCESS",
      body: JSON.stringify(updatedTicket),
    };
  } catch (e) {
    console.error(e.message === "HTTP request failed" ? JSON.stringify(e.response, null, 2) : e);
    return {
      status: "ERROR",
      body: JSON.stringify(e),
    };
  }
};
