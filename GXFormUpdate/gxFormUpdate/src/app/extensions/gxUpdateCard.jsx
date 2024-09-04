import React, { useEffect, useState } from "react";
import {
  Flex,
  hubspot,
  LoadingSpinner,
  Alert,
  Table,
  TableRow,
  TableCell,
  Text,
  Button,
  TableBody,
} from "@hubspot/ui-extensions";
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
    "apartment_access_preference",
    "apartment_access____date___time_requested_by_guest",
    "exists_reservation_id",
    "whatsapp_comms_preference",
  ];

  useEffect(() => {
    let isMounted = true;

    fetchProperties(propertiesToFetch).then((fetchedProperties) => {
      if (isMounted) {
        setProperties(fetchedProperties);
        fetchContacts(fetchedProperties.hs_object_id);
      }
    });

    return () => {
      isMounted = false;
    };
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
        console.log(
          "Contact Info: ",
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
      await refreshObjectProperties(); // Ensure this is awaited
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
        <Table bordered={false}>
          {contacts.map((contact, index) => (
            <TableBody key={index}>
              <TableRowComponent
                prop_name_1="Reservation ID"
                prop_value_1={contact.gx_form___reservation_id}
                prop_label="reservation_number"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="Apartment Booked"
                prop_value_1={contact.gx_form___apt__name}
                prop_label="apartment_booked__jonathan_test_"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="Apartment Access Preference"
                prop_value_1={contact.gx_form___access_preference.value}
                prop_label="apartment_access_preference"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="Apartment Access Date/Time Requested"
                prop_value_1={contact.gx_form_access_date_time_requested}
                prop_label="apartment_access____date___time_requested_by_guest"
                updateTicketProp={updateTicketProp}
              />
              <TableRowComponent
                prop_name_1="WhatsApp Comms Preference"
                prop_value_1={contact.gx_form_whatsapp_comms.value}
                prop_label="whatsapp_comms_preference"
                updateTicketProp={updateTicketProp}
              />
            </TableBody>
          ))}
        </Table>
      )}
    </>
  );
};

export default Extension;
