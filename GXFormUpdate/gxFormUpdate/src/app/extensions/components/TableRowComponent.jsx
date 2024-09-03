import React from "react";
import {
  Text,
  DescriptionList,
  DescriptionListItem,
  Button,
  Flex,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@hubspot/ui-extensions";

const TableRowComponent = ({
  prop_name_1,
  prop_value_1,
  prop_name_2,
  prop_label,
  updateTicketProp,
}) => {
  return (
    <>
      <Table bordered={false}>
        <TableBody>
          <TableRow>
            <TableCell align="left">
              <Text format={{ fontWeight: "bold" }}>{prop_name_1}</Text>
            </TableCell>
            <TableCell align="left">{prop_value_1}</TableCell>
            <TableCell align="right">
              <Button
                size="xs"
                onClick={async () => {
                  await updateTicketProp(prop_label, prop_value_1);
                }}
              >
                Update {prop_name_1}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {/*
      <Flex direction={"row"} justify={"center"}>
        <DescriptionList direction="row">
          <DescriptionListItem label={prop_name_1}>
            <Text>{prop_value_1}</Text>
            <Button
              size="xs"
              onClick={async () => {
                try {
                  await updateTicketProp(prop_label, prop_value_1);
                } catch (error) {
                  console.error("Error updating ticket property:", error);
                }
              }}
            >
              Update {prop_name_2}
            </Button>
          </DescriptionListItem>
        </DescriptionList>
        <DescriptionList direction="row">
          <DescriptionListItem>
            <Text>{prop_value_1}</Text>
            <Button
              size="xs"
              onClick={async () => {
                try {
                  await updateTicketProp(prop_label, prop_value_1);
                } catch (error) {
                  console.error("Error updating ticket property:", error);
                }
              }}
            >
              Update {prop_name_2}
            </Button>
          </DescriptionListItem>
        </DescriptionList>
      </Flex>
      <Divider />
      */}
    </>
  );
};

export default TableRowComponent;
