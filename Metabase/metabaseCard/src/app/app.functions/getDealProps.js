// for HubSpot API calls
const hubspot = require("@hubspot/api-client");

// Initialize HubSpot API client

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  const apiResponse = await hubspotClient.crm.properties.coreApi.getByName(
    "0-3",
    "hs_object_id",
    "check_in_date",
    "check_out_date",
    "backoffice_id",
    "guest_reservation_id",
    "associated_contact_email",
    "apartment_booked___list"
  );
  return apiResponse;
};
