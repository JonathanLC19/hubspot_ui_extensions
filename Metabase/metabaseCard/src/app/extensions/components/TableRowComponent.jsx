import React, { useState, useEffect } from "react";
import { Text, Button, TableRow, TableCell, Alert } from "@hubspot/ui-extensions";
import { type } from "os";

const TableRowComponent = ({
  prop_name_1,
  prop_value_1,
  prop_value_2,
  prop_label,
  updateDealProp,
}) => {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (prop_value_2 === "") {
      setAlert({ type: "warning", message: "HubSpot value is empty" });
    } else {
      let value1 = prop_value_1;
      let value2 = prop_value_2;

      if (prop_label.includes("date")) {
        // Parse and format the date from Metabase
        if (typeof prop_value_1 === "string") {
          // If it's a string (like "2024-08-18")
          const date1 = new Date(prop_value_1);
          const adjustedDate1 = new Date(date1.getTime() + 24 * 60 * 60 * 1000);
          value1 = adjustedDate1.toISOString().split("T")[0];
        } else if (typeof prop_value_1 === "number") {
          // If it's a number (like 1725235200000), convert from milliseconds
          const date1 = new Date(prop_value_1);
          const adjustedDate1 = new Date(date1.getTime() + 24 * 60 * 60 * 1000);
          value1 = adjustedDate1.toISOString().split("T")[0];
        }

        // Parse HubSpot date (assuming it's in milliseconds)
        if (prop_value_2) {
          const date2 = new Date(parseInt(prop_value_2));
          value2 = date2.toISOString().split("T")[0];
        }
      }
      console.log("value1", value1);
      console.log("value2", value2);

      if (value2 !== value1) {
        setAlert({ type: "error", message: "Values don't match" });
      } else {
        setAlert({ type: "success", message: "Values match" });
      }
    }
  }, [prop_value_1, prop_value_2, prop_label]);

  const handleUpdate = async () => {
    try {
      if (prop_label.includes("date")) {
        // Parse the date string from Metabase
        const date = new Date(prop_value_1);

        // Adjust for timezone offset (subtract one day)
        const adjustedDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

        // Format the date as YYYY-MM-DD
        const formattedDate = adjustedDate.toISOString().split("T")[0];

        console.log(`Updating ${prop_label} with value: ${formattedDate}`);
        await updateDealProp(prop_label, formattedDate);
      } else {
        console.log(`Updating ${prop_label} with value: ${prop_value_1}`);
        await updateDealProp(prop_label, prop_value_1);
      }
    } catch (error) {
      console.error("Error updating property:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <TableRow>
      <TableCell width={"min"}>
        <Text format={{ fontWeight: "bold" }}>{prop_name_1}</Text>
      </TableCell>
      <TableCell width={"min"}>{prop_value_1}</TableCell>
      <TableCell width={"min"}>
        <Button size="xs" onClick={handleUpdate}>
          Update {prop_name_1}
        </Button>
      </TableCell>
      <TableCell width={"min"}>
        {alert && (
          <Alert title={alert.type} variant={alert.type}>
            {alert.message}
          </Alert>
        )}
      </TableCell>
    </TableRow>
  );
};

export default TableRowComponent;
