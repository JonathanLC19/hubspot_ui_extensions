import React from "react";
import { Input } from "@hubspot/ui-extensions";

const selectComponent = ({
    prop_name_1,
    prop_value_1,
    prop_name_2,
    prop_label,
    updateTicketProp,
  }) => {
   return (
    <>
        <Select
            label="Select Work Order's Issue"
            name="issueSelect"
            tooltip="Issue to create a work order from"
            description="Select Issue"
            placeholder=""
            required={true}
            error={!isValid}
            validationMessage={validationMessage}
            onChange={(value) => {
            setIssueType(value);
            if (!value) {
                setValidationMessage('This is required');
                setIsValid(false);
            } else {
                setValidationMessage('Excellent!');
                setIsValid(true);
            }
            }}
            options={totalIssues}
        />
    </>
   );
  };