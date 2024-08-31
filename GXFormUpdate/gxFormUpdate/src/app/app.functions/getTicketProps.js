// for HubSpot API calls
const hubspot = require("@hubspot/api-client");

// Initialize HubSpot API client

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  const apiResponse = await hubspotClient.crm.properties.coreApi.getByName(
    "0-5",
    "hs_object_id",
    "content",
    "subject",
    "apartment_access_guest_confirmation",
    "reservation_number",
    "apartment_booked__jonathan_test_"
  );
  return apiResponse;
};
