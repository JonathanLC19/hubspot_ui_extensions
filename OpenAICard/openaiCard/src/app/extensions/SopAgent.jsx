import React, { useState, useEffect } from "react";
import {
  hubspot,
  TextArea,
  Button,
  Divider,
  Flex,
  LoadingSpinner,
  //   Table,
  //   TableHead,
  //   TableBody,
  //   TableCell,
  //   TableRow,
  //   TableHeader,
  Text,
} from "@hubspot/ui-extensions";

// Define the HubSpot UI extension entry point
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
    refreshObjectProperties={actions.refreshObjectProperties}
  />
));

// Define the Extension component
const Extension = ({ context, runServerless, fetchProperties }) => {
  const [description, setDescription] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [result, setResult] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [issueType, setIssueType] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState(null);
  const [currentDate, setCurrentDate] = useState(getDate());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const properties = await fetchProperties([
          "subject",
          "content",
          "issue_type",
          "hs_object_id",
        ]);

        setSubject(properties.subject);
        setContent(properties.content);
        setDescription(
          "Help me troubleshoot this request: " + "\n" + properties.content,
        );
        setIssueType(properties.issue_type);
        setCurrentObjectId(properties.hs_object_id);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchProperties]);

  // // Fetch issue type based on the description
  // // Handle description change and validate
  // const handleDescriptionChange = (value) => {
  //   setDescription(value);
  //   setIsValid(true);
  //   setValidationMessage("");
  // };

  // Fetch SOP information based on the question
  const fetchSOPInformation = async () => {
    try {
      setLoading(true);
      const response = await runServerless({
        name: "sopsAgent",
        parameters: {
          hs_object_id: currentObjectId,
        },
      });

      console.log("Full response:", response);

      if (response.status === "error") {
        let errorMessage = "Error fetching SOP information";

        // Handle 403 error specifically
        if (
          response.errors?.[0]?.subCategory ===
            "ServerlessActionExecutionError.SERVERLESS_FUNCTION_ERROR" &&
          response.errors[0].message?.includes("403")
        ) {
          errorMessage =
            "Authentication error. Please check your API credentials and permissions.";
        }

        setValidationMessage(errorMessage);
        setIsValid(false);
      } else if (response.error) {
        setValidationMessage(
          response.error.message || "Error fetching SOP information",
        );
        setIsValid(false);
      } else {
        setValidationMessage("Question processed successfully!");
        setIsValid(true);
        console.log("Setting result with:", response.response);
        setResult(response.response);
        setCurrentDate(getDate());
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
        {/* TextArea for user to input their SOP-related questions 
        <TextArea
          label="Question"
          name="description"
          placeholder="Ask a question about SOPs..."
          value={description}
          onChange={handleDescriptionChange}
          error={!isValid}
          validationMessage={validationMessage}
        /> */}
        <Button variant="primary" onClick={handleGetAnswerClick}>
          Get troubleshooting hints from ticket conversation
        </Button>
        <Divider />
        {loading && (
          <LoadingSpinner
            label="🤖🪄 AI Agent working..."
            showLabel={true}
            size="md"
            layout="centered"
          ></LoadingSpinner>
        )}
        {!isValid && <Text>{validationMessage}</Text>}
        {result && (
          <Flex direction="column" gap="small">
            <Text format={{ fontWeight: "bold" }}>Troubleshooting Guide</Text>
            <Text format={{ fontWeight: "bold" }}>Last updated:</Text>
            <Text>{currentDate}</Text>
            <Divider />
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
