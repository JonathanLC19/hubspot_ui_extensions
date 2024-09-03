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
    "apartment_booked__jonathan_test_",
    "apartment_access_preference",
    "apartment_access____date___time_requested_by_guest",
    "exists_reservation_id",
    "whatsapp_comms_preference"
  );
  return apiResponse;
};
