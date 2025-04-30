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
  const [result, setResult] = useState("");
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
        let errorMessage = "Error fetching SOP information";

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
      setValidationMessage("Question processed successfully!");
      setIsValid(true);
      setResult(response.response);
      setCurrentDate(getDate());
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
      <Flex
        direction={"column"}
        justify={"between"}
        wrap={"wrap"}
        gap={"small"}
      >
        <TextArea
          label="Description"
          name="description"
          placeholder="Enter text"
          value={description}
          onChange={handleDescriptionChange}
          error={!isValid}
          validationMessage={validationMessage}
        />
        <Button variant="primary" onClick={handleFetchIssueTypeClick}>
          Refresh Issue Info
        </Button>
        <Divider />
        {loading && (
          <LoadingSpinner
            label="Response is loading"
            showLabel={true}
            size="sm"
            layout="centered"
          ></LoadingSpinner>
        )}
        {!isValid && <Text>{validationMessage}</Text>}
        {result && (
          <Table bordered={true} width="auto">
            <TableHead>
              <TableRow>
                <TableHeader>Type of Issue</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{result}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Flex>
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
