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
  const fetchIssueType = async () => {
    try {
      if (!description.trim()) {
        setValidationMessage("Please enter some text to analyze.");
        setIsValid(false);
        return;
      }
      setLoading(true); // Set loading to true when the request starts
      const response = await runServerless({
        name: "issueFinder", // Replace with your actual serverless function name
        parameters: { text: description },
      });

      console.log("Full response:", response);

      if (response.error) {
        setValidationMessage(
          response.error.message || "Error fetching sentiment analysis",
        );
        setIsValid(false);
      } else {
        setValidationMessage("Valid description!");
        setIsValid(true);
        setResult(response.response.result); // Set the result from OpenAI
        setIssueType(response.response.result.trim()); // Set the issue type directly from the result
        return response.response.result.trim(); // Return the issue type
      }
    } catch (err) {
      setValidationMessage("Error fetching sentiment analysis");
      setIsValid(false);
      console.error(err);
    } finally {
      setLoading(false); // Set loading to false when the request finishes
    }
  };

  // Handle description change and validate
  const handleDescriptionChange = (value) => {
    setDescription(value);
    if (!value.includes("http")) {
      setValidationMessage("A link must be included.");
      setIsValid(false);
    } else {
      setValidationMessage("Valid description!");
      setIsValid(true);
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

  // Removed useEffect that fetched issue type automatically on description change
  // useEffect(() => {
  //   if (description) {
  //     fetchIssueType();
  //   }
  // }, [description]);

  // Removed useEffect that updated issue type automatically
  // useEffect(() => {
  //   if (issueType) {
  //     onChange(issueType);
  //   }
  // }, [issueType]);

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
