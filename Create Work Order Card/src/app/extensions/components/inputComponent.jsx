import React from "react";
import { Input } from "@hubspot/ui-extensions";

const inputComponent = ({
    prop_name_1,
    prop_value_1,
    prop_name_2,
    prop_label,
    updateTicketProp,
  }) => {
   return (
    <>
        <Input
            label="Troubleshooting message"
            name="troubleshooting_message"
            value={woTroubleshooting}
            // tooltip="Define the description of the work order"
            // description="Please enter your work order description"
            placeholder="Work order description"
            required={true}
            error={!isValid}
            validationMessage={validationMessage}
            onChange={(value) => {
            setWoTroubleshooting(value);
            }}
            onInput={(value) => {
                if (value === '') {
                setValidationMessage('Work order description is required');
                setIsValid(false);
                } else if (value.length < 10) {
                setValidationMessage('Description must be at least 10 characters long');
                setIsValid(false);
                } else {
                setWoTroubleshooting(value);
                setValidationMessage('Valid work order description');
                setIsValid(true);
                }
            }}
        />
    </>
   );
  };