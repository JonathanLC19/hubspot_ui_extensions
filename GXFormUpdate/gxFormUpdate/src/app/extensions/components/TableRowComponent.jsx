import React from "react";
import {
  TableCell,
  TableRow,
  Text,
  DescriptionList,
  DescriptionListItem,
} from "@hubspot/ui-extensions";

const TableRowComponent = ({ prop_name_1, prop_value_1, prop_name_2, prop_value_2 }) => {
  return (
    <TableRow>
      <TableCell>
        <DescriptionList direction="row">
          <DescriptionListItem label={prop_name_1}>
            <Text>{prop_value_1}</Text>
          </DescriptionListItem>
        </DescriptionList>
      </TableCell>
      <TableCell>
        <DescriptionList direction="row">
          <DescriptionListItem label={prop_name_2}>
            <Text>{prop_value_2}</Text>
          </DescriptionListItem>
        </DescriptionList>
      </TableCell>
    </TableRow>
  );
};

export default TableRowComponent;
