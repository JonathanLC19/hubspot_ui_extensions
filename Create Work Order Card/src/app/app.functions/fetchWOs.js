const axios = require("axios");

exports.main = async (context = {}) => {
  try {
    const { hs_object_id } = context.parameters;

    const query = `
      query objectData($hs_object_id: String!) {
        CRM {
          ticket(uniqueIdentifier: "hs_object_id", uniqueIdentifierValue: $hs_object_id) {
            hs_object_id
            associations {
              p_workorders_collection__ticket_to_workorders {
                items {
                  hs_object_id,
                  description,
                  apartment_name,
                  booking_id,
                  city,
                  issue_type,
                  work_order_name,
                  work_order_requester,
                  reservation_id,
                  ticketId,
                  troubleshooting_message
                }
              }
            }
          }
        }
      }
    `;

    const PRIVATE_APP_TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;

    // Fetch associated objects and assign to a const (before: fetchAssociatedShipments)
    const { data } = await fetchAssociatedObject(
      query,
      PRIVATE_APP_TOKEN,
      hs_object_id,
    );

    // Send the response data
    console.log("Response data:", data); // Agrega este console.log para ver la respuesta
    return data;
  } catch (error) {
    console.error("Error:", error);
    return {
      status: "ERROR",
      error: error.message,
    };
  }
};

//before: fetchAssociatedShipments
const fetchAssociatedObject = (query, token, hs_object_id) => {
  // Set our body for the axios call
  const body = {
    operationName: "objectData", //before: shipmentData
    query,
    variables: { hs_object_id },
  };

  // return the axios post
  return axios.post(
    "https://api.hubapi.com/collector/graphql",
    JSON.stringify(body),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
