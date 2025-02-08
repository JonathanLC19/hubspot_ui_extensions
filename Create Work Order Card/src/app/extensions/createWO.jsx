import React, { useState, useEffect } from "react";
import { Text, hubspot } from "@hubspot/ui-extensions";

const Extension = ({ fetchProperties }) => {
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [issueType, setIssueType] = useState("");
  const [totalIssues, setTotalIssues] = useState([]);
  const [hsObjectId, setHsObjectId] = useState("");

  // Fetch initial properties from HubSpot
  useEffect(() => {
    fetchProperties(["subject", "content", "issue_type", "hs_object_id"])
      .then((properties) => {
        console.log("Properties fetched:", properties);
        if (properties && properties.subject && properties.content) {
          setSubject(properties.subject);
          setContent(properties.content);
          setDescription(properties.content);
          setIssueType(properties.issue_type);
          setHsObjectId(properties.hs_object_id);
          setTotalIssues(properties.total_issues);
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

  return (
    <>
      <Text>Hello World</Text>
      <Text>{description}</Text>
      <Text>{subject}</Text>
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