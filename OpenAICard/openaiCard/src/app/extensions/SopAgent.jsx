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
  const [source, setSource] = useState("");
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
          "source_type",
        ]);

        setSubject(properties.subject);
        setContent(properties.content);
        setSource(properties.source_type);
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
      console.log("Calling serverless function with ID:", currentObjectId);

      const response = await runServerless({
        name: "sopsAgent",
        parameters: {
          hs_object_id: currentObjectId,
          source_type: source,
          content: content,
          verifyKeys: true, // Add flag to request key verification
        },
      });

      // // Log API verification results from serverless function
      // if (response.apiVerification) {
      //   console.log("Server-side API verification:", response.apiVerification);
      // }

      // // Enhanced API verification logging
      // console.log("API Keys Status:", {
      //   hubspotToken: response.hubspotTokenStatus,
      //   openaiToken: response.openaiTokenStatus,
      //   hubspotPrefix: response.hubspotTokenPrefix,
      //   openaiPrefix: response.openaiTokenPrefix,
      // });

      console.log("Full response:", response);

      // console.log("Response type:", typeof response);
      // console.log("Response structure:", {
      //   status: response.status,
      //   hasError: !!response.error,
      //   hasResponse: !!response.response,
      //   responseType: typeof response.response,
      //   apiKeysVerified: !!(
      //     response.hubspotTokenStatus && response.openaiTokenStatus
      //   ),
      // });

      // if (!response.hubspotTokenStatus || !response.openaiTokenStatus) {
      //   setValidationMessage(
      //     "API keys verification failed. Please check your configuration.",
      //   );
      //   setIsValid(false);
      //   return;
      // }

      if (response.status === "error") {
        let errorMessage = "Error fetching SOP information";

        if (response.error?.includes("OpenAI API key")) {
          errorMessage =
            "OpenAI API key is missing or invalid. Please check your configuration.";
        } else if (response.error?.includes("HubSpot token")) {
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
      console.error("Error in fetchSOPInformation:", err);
      setValidationMessage("Error processing your request. Please try again.");
      setIsValid(false);
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
          Summarize guest communications
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
            {/* <Text format={{ fontWeight: "bold" }}>Troubleshooting Guide</Text> */}
            <Text format={{ fontWeight: "bold" }}>Ticket Source:</Text>
            <Text>{source}</Text>
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
