import React, { useEffect, useState } from "react";
import { Flex, hubspot, LoadingSpinner, Alert } from "@hubspot/ui-extensions";
import TableRowComponent from "./components/TableRowComponent";

hubspot.extend(({ actions, runServerlessFunction }) => (
  <Extension
    actions={actions}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
  />
));

const Extension = ({ actions, runServerless, fetchProperties }) => {
  const { onCrmPropertiesUpdate, refreshObjectProperties } = actions;

  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState({});
  const [alert, setAlert] = useState(null);

  const propertiesToFetch = [
    "hs_object_id",
    "content",
    "subject",
    "apartment_access_guest_confirmation",
    "reservation_number",
    "apartment_booked__jonathan_test_",
  ];

  useEffect(() => {
    fetchProperties(propertiesToFetch).then((fetchedProperties) => {
      setProperties(fetchedProperties);
      fetchContacts(fetchedProperties.hs_object_id);
    });
  }, []);

  onCrmPropertiesUpdate(propertiesToFetch, (updatedProperties) => {
    setProperties(updatedProperties);
  });

  const fetchContacts = async (objectId) => {
    try {
      const resp = await runServerless({
        name: "getGxfProperties",
        parameters: { hs_object_id: objectId },
      });

      if (resp.status === "SUCCESS" && resp.response.data !== null) {
        setContacts(
          resp.response.data.CRM.ticket.associations.contact_collection__ticket_to_contact.items
        );
      } else {
        console.warn("No data returned from getGxfProperties");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketProp = async (prop_name, prop_value) => {
    try {
      await runServerless({
        name: "updateTicketProps",
        parameters: { prop_name, prop_value, ticketId: properties.hs_object_id },
      });
      refreshObjectProperties();
      setAlert({ type: "success", message: "Property updated successfully" });
    } catch (error) {
      console.error("Error updating ticket property:", error);
      setAlert({ type: "error", message: "Failed to update property" });
    }
    // Clear the alert after 3 seconds
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <>
      {loading && (
        <LoadingSpinner label="Data is loading" showLabel={true} size="md" layout="centered" />
      )}

      {alert && (
        <Alert title={alert.type === "success" ? "Success" : "Error"} variant={alert.type}>
          {alert.message}
        </Alert>
      )}

      {contacts && (
        <Flex direction="column" justify="left" gap="large">
          {contacts.map((contact, index) => (
            <>
              <TableRowComponent
                prop_name_1="Case Description"
                prop_value_1={contact.gx_form___case_description || ""}
                prop_name_2="Ticket Description"
                prop_value_2={properties.content || ""}
                prop_label="content"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="Apartment Access"
                prop_value_1={contact.gx_form___apartment_access.value || ""}
                prop_name_2="Ticket Apartment Access"
                prop_value_2={properties.apartment_access_guest_confirmation.value || ""}
                prop_label="apartment_access_guest_confirmation"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="Reservation ID"
                prop_value_1={contact.gx_form___reservation_id || ""}
                prop_name_2="Ticket Reservation ID"
                prop_value_2={properties.reservation_number || ""}
                prop_label="reservation_number"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="Apartment Booked"
                prop_value_1={contact.gx_form___apt__name || ""}
                prop_name_2="Ticket Apartment Booked"
                prop_value_2={properties.apartment_booked__jonathan_test_ || ""}
                prop_label="apartment_booked__jonathan_test_"
                updateTicketProp={updateTicketProp}
              />
            </>
          ))}
        </Flex>
      )}
    </>
  );
};

export default Extension;
