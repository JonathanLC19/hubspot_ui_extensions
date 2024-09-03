const axios = require("axios");

exports.main = async (context = {}) => {
  // const's are set by parameters that were passed in and from our secrets
  const { hs_object_id } = context.parameters;
  const PRIVATE_APP_TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;

  try {
    // Fetch associated objects and assign to a const (before: fetchAssociatedShipments)
    const { data } = await fetchAssociatedObject(query, PRIVATE_APP_TOKEN, hs_object_id);

    // Send the response data
    console.log("Response data:", data); // Agrega este console.log para ver la respuesta
    return data;
  } catch (e) {
    console.error("Error fetching data:", e); // Mejora la gestión de errores
    return e;
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
  return axios.post("https://api.hubapi.com/collector/graphql", JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

// GraphQL query to fetch object associations and nested other associations from HubSpot
const query = `
query objectData($hs_object_id: String!) {
  CRM {
    ticket(uniqueIdentifier: "hs_object_id", uniqueIdentifierValue: $hs_object_id) {
      hs_object_id
      subject
      content
      associations {
        contact_collection__ticket_to_contact {
          items {
            gx_form___access_preference
            gx_form___apartment_access
            gx_form___apt__name
            gx_form___case_description
            gx_form___case_details
            gx_form___exists_reservation_id
            gx_form___issue_category
            gx_form___reservation_id
            gx_form_access_date_time_requested
            gx_form_whatsapp_comms
            gx_form_submission_date
            email
            firstname
            lastname
            hs_object_id
          }
        }
      }
    }
  }
}
`;
