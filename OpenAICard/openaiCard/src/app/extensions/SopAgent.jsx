import React, { useState, useEffect } from "react";
import {
  hubspot,
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
  Text
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
  const [hsObjectId, setHsObjectId] = useState("");

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
          setHsObjectId(properties.hs_object_id);
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

  // Fetch issue type based on the description
  // Handle description change and validate
  const handleDescriptionChange = (value) => {
    setDescription(value);
    setIsValid(true);
    setValidationMessage("");
  };

  // Fetch SOP information based on the question
  const fetchIssueType = async () => {
    try {
      if (!description.trim()) {
        setValidationMessage("Please enter your question about SOPs.");
        setIsValid(false);
        return;
      }
      setLoading(true);
      const response = await runServerless({
        name: "sopsAgent",
        parameters: {
          prompt: description,
        },
      });

      console.log("Full response:", response);

      if (response.error) {
        setValidationMessage(
          response.error.message || "Error fetching SOP information",
        );
        setIsValid(false);
      } else {
        setValidationMessage("Question processed successfully!");
        setIsValid(true);
        console.log("Setting result with:", response.response);
        setResult(response.response);
        return response.response;
      }
    } catch (err) {
      setValidationMessage("Error processing your question");
      setIsValid(false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update issue type in the backend
  const updateIssueType = (issueTypeValue) => {
    console.log(issueTypeValue);
    runServerless({
      name: "updateIssueType",
      parameters: { issueType: issueTypeValue },
      propertiesToSend: ["hs_object_id"],
    }).then(() => {
      refreshObjectProperties();
    });
  };

  // Handle button click to fetch issue type and update manually
  const handleFetchIssueTypeClick = async () => {
    const newIssueType = await fetchIssueType();
    if (newIssueType) {
      updateIssueType(newIssueType);
    }
  };

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
          Get Answer
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
                <TableHeader>Response</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell style={{ whiteSpace: 'pre-wrap' }}>{result}</TableCell>
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
