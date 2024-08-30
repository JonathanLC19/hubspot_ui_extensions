import React, { useEffect, useState } from "react";
import { Button, Flex, hubspot, LoadingSpinner, Heading } from "@hubspot/ui-extensions";
import TableRowComponent from "./components/TableRowComponent";

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
  />
));

const Extension = ({ context, runServerless, fetchProperties }) => {
  const [contacts, setContacts] = useState(null);
  const [currentObjectID, setCurrentObjectID] = useState(null);
  const [ticketDescription, setTicketDescription] = useState(null);
  const [ticketName, setTicketName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertiesToFetch = ["hs_object_id", "content", "subject"].filter(Boolean);
        if (propertiesToFetch.length === 0) {
          console.warn("No properties to fetch");
          return;
        }

        const properties = await fetchProperties(propertiesToFetch);
        if (properties) {
          setCurrentObjectID(properties.hs_object_id || null);
          setTicketDescription(properties.content || null);
          setTicketName(properties.subject || null);
        } else {
          console.warn("No properties returned from fetchProperties");
        }

        if (properties.hs_object_id) {
          const resp = await runServerless({
            name: "getGxfProperties",
            parameters: { hs_object_id: properties.hs_object_id },
          });

          if (resp.status === "SUCCESS" && resp.response.data !== null) {
            setContacts(
              resp.response.data.CRM.ticket.associations.contact_collection__ticket_to_contact.items
            );
          } else {
            console.warn("No data returned from getGxfProperties");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {loading && (
        <LoadingSpinner label="Data is loading" showLabel={true} size="md" layout="centered" />
      )}

      {contacts && (
        <>
          <Flex direction={"column"} justify={"left"} gap={"large"}>
            <Heading>GX Form Info</Heading>
          </Flex>
          <Flex direction={"row"} justify={"left"} wrap={"nowrap"} gap={"extra-small"}>
            {/* <TableHead>
              <TableRow>
                <TableHeader>Form Submission</TableHeader>
                <TableHeader>Ticket Property</TableHeader>
                <TableHeader>Update Ticket Property</TableHeader>
              </TableRow>
            </TableHead> */}
            {contacts.map((contact) => (
              <>
                <TableRowComponent
                  prop_name_1={"Case Description"}
                  prop_value_1={contact.gx_form___case_description}
                  prop_name_2={"Ticket Description"}
                  prop_value_2={ticketDescription}
                />
              </>
            ))}
          </Flex>
        </>
      )}
    </>
  );
};

export default Extension;
