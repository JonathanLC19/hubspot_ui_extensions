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
  Text,
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
          setDescription(
            "Help me troubleshoot this request: " + "\n" + properties.content,
          );
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
  const fetchSOPInformation = async () => {
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
      }
    } catch (err) {
      setValidationMessage("Error processing your question");
      setIsValid(false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle button click to get SOP answer
  const handleGetAnswerClick = () => {
    fetchSOPInformation();
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
          label="Question"
          name="description"
          placeholder="Ask a question about SOPs..."
          value={description}
          onChange={handleDescriptionChange}
          error={!isValid}
          validationMessage={validationMessage}
        />
        <Button variant="primary" onClick={handleGetAnswerClick}>
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
          <Flex direction="column" gap="small">
            <Text format={{ fontWeight: "bold" }}>Troubleshooting Guide</Text>
            <Flex
              direction="column"
              gap="medium"
              style={{
                backgroundColor: "#f5f8fa",
                padding: "12px",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.split("\n").map((line, index) => {
                // Check for different types of lines
                const isNumberedSection = /^\d+\.\s\*\*.*\*\*/.test(
                  line.trim(),
                );
                const isBulletPoint = line.trim().startsWith("-");
                const indentLevel = isBulletPoint ? "24px" : "0";

                let formattedLine = line;
                if (isNumberedSection) {
                  formattedLine = line.replace(
                    /^\d+\.\s\*\*(.*?)\*\*:?/,
                    "$1:",
                  );
                }

                return (
                  <Text
                    key={index}
                    style={{
                      marginLeft: indentLevel,
                      marginTop: isNumberedSection ? "12px" : "4px",
                    }}
                    format={{
                      fontWeight: isNumberedSection ? "bold" : "regular",
                      fontSize: isNumberedSection ? "14px" : "13px",
                    }}
                  >
                    {formattedLine}
                  </Text>
                );
              })}
            </Flex>
          </Flex>
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
