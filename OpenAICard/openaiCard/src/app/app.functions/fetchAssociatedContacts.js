//Requirements
const axios = require("axios");

exports.main = async (context = {}) => {
  const { hs_object_id } = context.parameters;
  const PRIVATE_APP_TOKEN = process.env.PRIVATE_APP_ACCESS_TOKEN;

  if (!hs_object_id) {
    console.error("No ticketId provided");
    return {
      status: "ERROR",
      error: "No ticketId provided",
    };
  }

  try {
    const { data } = await fetchAssociatedContacts(
      query,
      PRIVATE_APP_TOKEN,
      hs_object_id,
    );

    return { data };
  } catch (e) {
    console.error("Error fetching data:", e); // Mejora la gestión de errores
    return e;
  }
};

const fetchAssociatedContacts = (query, token, hs_object_id) => {
  const body = {
    operationName: "contactsSearch",
    query,
    variables: { hs_object_id },
  };

  return axios.post(
    "https://api.hubapi.com/collector/graphql",
    JSON.stringify(body), // Remove JSON.stringify as axios will handle it
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

//GraphQL query to fetch the contacts
const query = `
query contactsSearch($hs_object_id: String!) {
  CRM {
    ticket(uniqueIdentifier: "hs_object_id", uniqueIdentifierValue: $hs_object_id) {
      hs_object_id
      subject
      associations {
        engagement_collection__ticket_to_engagement {
          items{
            hs_conversation_session_source
            hs_conversation_session_visitor_start_time
            hs_conversation_session_visitor_wait_time
            hs_conversation_session_visitor_end_time
            hs_conversation_session_thread_id
            hs_email_from_email
            hs_email_to_email
            hs_email_subject
            hs_engagement_source
            hs_engagement_type
            hs_object_source
            hs_createdate
            hs_body_preview
          }
        }
        contact_collection__ticket_to_contact {
          items {
            firstname
            lastname
            hs_object_id
            email
            associations {
              deal_collection__contact_to_deal {
                items {
                  backoffice_id
                  dealname
                  hs_object_id
                }
              }
              engagement_collection__contact_to_engagement {
                items {
                  hs_conversation_session_source
                  hs_conversation_session_visitor_start_time
                  hs_conversation_session_visitor_wait_time
                  hs_conversation_session_visitor_end_time
                  hs_conversation_session_thread_id
                  hs_email_from_email
                  hs_email_to_email
                  hs_email_subject
                  hs_engagement_source
                  hs_engagement_type
                  hs_object_source
                  hs_createdate
                  hs_body_preview
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
