import React, { useState, useEffect } from "react";
import {
  hubspot,
  Text,
  TextArea,
  Button,
  Divider,
  Flex,
  LoadingSpinner,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  Alert,
  Accordion,
} from "@hubspot/ui-extensions";

// Define the Extension component
const Extension = ({
  context,
  runServerless,
  fetchProperties,
  refreshObjectProperties,
}) => {
  const [description, setDescription] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [result, setResult] = useState({
    associatedTickets: [],
    associatedWOs: [],
  });
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [issueType, setIssueType] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState(null);

  // Fetch initial properties from HubSpot
  useEffect(() => {
    fetchProperties(["subject", "content", "issue_type", "hs_object_id"])
      .then((properties) => {
        console.log("Properties fetched:", properties); // Log all fetched properties for debugging
        if (properties && properties.subject && properties.content) {
          setSubject(properties.subject);
          setContent(properties.content);
          setDescription(properties.content);
          setIssueType(properties.issue_type);
          setCurrentObjectId(properties.hs_object_id);
        } else {
          console.error(
            "Error: subject or content not found in properties:",
            properties,
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching properties:", error);
      });
  }, [fetchProperties]);

  const fetchTicketAssociations = async () => {
    try {
      setLoading(true);
      console.log("Calling serverless function with ID:", currentObjectId);

      const response = await runServerless({
        name: "associationTest",
        parameters: {
          hs_object_id: currentObjectId,
        },
      });

      console.log("Full response:", response);

      if (response.status === "error") {
        let errorMessage = "Error fetching associations";
        if (response.error?.includes("HubSpot token")) {
          errorMessage =
            "HubSpot access token is missing or invalid. Please check your configuration.";
        } else if (response.errors?.[0]?.message?.includes("403")) {
          errorMessage =
            "Authentication error. Please check your API credentials and permissions.";
        }
        setValidationMessage(errorMessage);
        setIsValid(false);
        return;
      }

      // Process successful response
      const associatedData = {
        associatedTickets: response.response.response.associatedTickets || [],
        associatedWOs: response.response.response.associatedWOs || [],
      };

      const totalWOAssociations = associatedData.associatedWOs.length;
      const totalTicketAssociations = associatedData.associatedTickets.length;
      setValidationMessage(
        totalWOAssociations > 0 || totalTicketAssociations > 0
          ? `Found ${totalWOAssociations} work orders and ${totalTicketAssociations} tickets`
          : "No associations found",
      );

      setIsValid(true);
      setResult(associatedData);
    } catch (err) {
      console.error("Error in fetchTicketAssociations:", err);
      setValidationMessage("Error processing your request. Please try again.");
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle button click to get SOP answer
  const handleGetAssociationsClick = () => {
    fetchTicketAssociations();
  };

  function getDate() {
    const currentDate = new Date();
    return currentDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <Button variant="primary" onClick={handleGetAssociationsClick}>
        Fetch Associations
      </Button>

      {loading && (
        <LoadingSpinner
          label="Fetching associations..."
          showLabel={true}
          size="md"
          layout="centered"
        />
      )}

      {!isValid && (
        <Alert title="Error" variant="error">
          {validationMessage}
        </Alert>
      )}

      {isValid && !loading && (
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
                        {new Date(
                          wo.properties.hs_createdate,
                        ).toLocaleDateString()}
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
                      <TableCell>
                        {tck.properties.issue_type || "N/A"}
                      </TableCell>
                      <TableCell>
                        {tck.properties.hs_pipeline_stage || "N/A"}
                      </TableCell>
                      <TableCell>{tck.properties.content || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(
                          tck.properties.createdate,
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : null}
        </Flex>
      )}
    </>
  );
};

// Define the HubSpot UI extension entry point
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
    refreshObjectProperties={actions.refreshObjectProperties}
  />
));
