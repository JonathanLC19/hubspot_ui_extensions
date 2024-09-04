import React from "react";
import { Text, Button, TableRow, TableCell } from "@hubspot/ui-extensions";

const TableRowComponent = ({ prop_name_1, prop_value_1, prop_label, updateDealProp }) => {
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
      <TableCell>
        <Text format={{ fontWeight: "bold" }}>{prop_name_1}</Text>
      </TableCell>
      <TableCell>{prop_value_1}</TableCell>
      <TableCell>
        <Button size="xs" onClick={handleUpdate}>
          Update {prop_name_1}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TableRowComponent;
