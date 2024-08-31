import React from "react";
import {
  Text,
  DescriptionList,
  DescriptionListItem,
  Button,
  Flex,
  Divider,
  Alert,
} from "@hubspot/ui-extensions";

const TableRowComponent = ({
  prop_name_1,
  prop_value_1,
  prop_name_2,
  prop_value_2,
  prop_label,
  updateTicketProp,
}) => {
  return (
    <>
      <Flex direction={"row"} justify={"center"}>
        <DescriptionList direction="row">
          <DescriptionListItem label={prop_name_1}>
            <Text>{prop_value_1}</Text>
          </DescriptionListItem>
        </DescriptionList>
        <DescriptionList direction="row">
          <DescriptionListItem label={prop_name_2}>
            <Text>{prop_value_2}</Text>
          </DescriptionListItem>
        </DescriptionList>
        <DescriptionList direction="row">
          <DescriptionListItem>
            <Button
              onClick={async () => {
                try {
                  await updateTicketProp(prop_label, prop_value_1);
                  // Remove the Alert components from here
                  // We'll handle the alerts in the parent component
                } catch (error) {
                  console.error("Error updating ticket property:", error);
                  // Rethrow the error so it can be handled in the parent component
                  throw error;
                }
              }}
            >
              Update {prop_name_2}
            </Button>
          </DescriptionListItem>
        </DescriptionList>
      </Flex>
      <Divider />
    </>
  );
};

export default TableRowComponent;
