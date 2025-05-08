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
    <Flex direction="column" gap="small">
      {/* <Divider />
          <Alert title="Status" variant="info">
            {validationMessage}
          </Alert> */}

      {/* Display Work Orders */}
      {result.associatedWOs && result.associatedWOs.length > 0 ? (
        <>
          <Text format={{ fontWeight: "bold" }}>Work Orders:</Text>
          <Table bordered={true}>
            <TableHead>
              <TableRow>
                <TableHeader>Work Order Name</TableHeader>
                <TableHeader>Issue Type</TableHeader>
                <TableHeader>Pipeline Stage</TableHeader>
                <TableHeader>Created Date</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.associatedWOs.map((wo, index) => (
                <TableRow key={wo.id}>
                  <TableCell>
                    {wo.properties.work_order_name || "N/A"}
                  </TableCell>
                  <TableCell>{wo.properties.issue_type || "N/A"}</TableCell>
                  <TableCell>
                    {wo.properties.hs_pipeline_stage || "N/A"}
                  </TableCell>
                  <TableCell>
                    {new Date(wo.properties.hs_createdate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : null}
      {/* Display Tickets */}
      {result.associatedTickets && result.associatedTickets.length > 0 ? (
        <>
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
        </>
      ) : null}
    </Flex>
  );
};
