import React, { useState, useEffect } from "react";
import {
  Alert,
  LoadingSpinner,
  Text,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Accordion,
  Box,
  Heading,
} from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

// Define the extension to be run within the Hubspot CRM
hubspot.extend(() => <AssociationsSummary />);

// Define the Extension component
const AssociationsSummary = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState({
    associatedTickets: [],
    associatedWOs: [],
  });

  useEffect(() => {
    // Request statistics data from serverless function
    hubspot
      .serverless("associationTest", {
        propertiesToSend: ["hs_object_id"],
      })
      .then((response) => {
        setResult({
          associatedTickets: response.response.associatedTickets || [],
          associatedWOs: response.response.associatedWOs || [],
        });
      })
      .catch((error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    // If loading, show a spinner
    return <LoadingSpinner />;
  }
  if (errorMessage) {
    // If there's an error, show an alert
    return (
      <Alert title="Unable to get associations data" variant="error">
        {errorMessage}
      </Alert>
    );
  }
  return (
    <Flex direction="column" gap="md">
      {/* <Divider />
          <Alert title="Status" variant="info">
            {validationMessage}
          </Alert> */}

      {/* Display Work Orders */}
      {result.associatedWOs && result.associatedWOs.length > 0 ? (
        <>
          <Accordion title="Work Orders" defaultOpen={true}>
            {result.associatedWOs.map((wo, index) => (
              <Flex direction="row" justify="start" gap="md">
                <Box flex={1}>
                  <Heading>{wo.properties.work_order_name || "N/A"}</Heading>
                  <Flex direction="row" justify="start" gap="sm">
                    <Box>
                      <Text format={{ fontWeight: "bold" }}>Issue Type</Text>
                      <Text>{wo.properties.issue_type || "N/A"}</Text>
                    </Box>
                    <Box>
                      <Text format={{ fontWeight: "bold" }}>Stage</Text>
                      <Text>{wo.properties.hs_pipeline_stage || "N/A"}</Text>
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            ))}
          </Accordion>
        </>
      ) : null}
      {/* Display Tickets */}
      {result.associatedTickets && result.associatedTickets.length > 0 ? (
        <>
          <Accordion title="Tickets" defaultOpen={false}>
            {result.associatedTickets.map((tck, index) => (
              <Box flex={1}>
                <Heading>{tck.properties.subject || "N/A"}</Heading>
              </Box>
            ))}
            <Text format={{ fontWeight: "bold" }}>Tickets:</Text>
            <Table bordered={true}>
              <TableHead>
                <TableRow>
                  <TableHeader>Ticket Name</TableHeader>
                  <TableHeader>Issue Type</TableHeader>
                  <TableHeader>Pipeline Stage</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Created Date</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.associatedTickets.map((tck, index) => (
                  <TableRow key={tck.id}>
                    <TableCell>{tck.properties.subject || "N/A"}</TableCell>
                    <TableCell>{tck.properties.issue_type || "N/A"}</TableCell>
                    <TableCell>
                      {tck.properties.hs_pipeline_stage || "N/A"}
                    </TableCell>
                    <TableCell>{tck.properties.content || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(tck.properties.createdate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Accordion>
        </>
      ) : null}
    </Flex>
  );
};
