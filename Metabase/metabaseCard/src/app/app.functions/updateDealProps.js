const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
  const { prop_name, prop_value, dealId } = context.parameters;

  console.log("Received parameters:", context.parameters); // Add this line for debugging

  if (!dealId) {
    console.error("dealId is missing from the parameters");
    return {
      status: "ERROR",
      body: JSON.stringify({ message: "dealId is required" }),
    };
  }

  const hubspotClient = new hubspot.Client({ accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN });

  const properties = {
    [prop_name]: prop_value,
  };
  const SimplePublicObjectInput = { properties };

  try {
    await hubspotClient.crm.deals.basicApi.update(dealId, SimplePublicObjectInput);

    // Fetch the updated deal to get all properties
    const updatedDeal = await hubspotClient.crm.deals.basicApi.getById(dealId, ["*"]);

    console.log("Updated deal:", JSON.stringify(updatedDeal, null, 2));
    return {
      status: "SUCCESS",
      body: JSON.stringify(updatedDeal),
    };
  } catch (e) {
    console.error("Error updating deal:", e);
    return {
      status: "ERROR",
      body: JSON.stringify(e),
    };
  }
};
