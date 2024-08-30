import React from "react";
import { Text, DescriptionList, DescriptionListItem, Button } from "@hubspot/ui-extensions";

const TableRowComponent = ({ prop_name_1, prop_value_1, prop_name_2, prop_value_2 }) => {
  return (
    <>
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
        <DescriptionListItem label={"Update " + prop_name_2}>
          <Button onClick={() => console.log("Clicked")} variant="secondary" size="xs">
            Update
          </Button>
        </DescriptionListItem>
      </DescriptionList>
    </>
  );
};

export default TableRowComponent;
