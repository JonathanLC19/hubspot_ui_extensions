import React, { useState } from "react";
import {
  hubspot,
  CrmPropertyList,
  Text,
  Button,
  Flex,
  Box,
} from "@hubspot/ui-extensions";

hubspot.extend(({ context, actions }) => (
  <NewAppCard context={context} actions={actions} />
));

const NewAppCard = ({ context }) => {
  const [showMore, setShowMore] = useState(false);
  const record = context?.crm?.object;

  return (
    <Flex direction="column" gap="sm">
      <Text format={{ fontWeight: "bold" }}>New App Card</Text>
      <Text>Quick view of key contact properties.</Text>

      <CrmPropertyList
        properties={["firstname", "lastname", "email"]}
        object={record}
      />

      <Box>
        <Button
          onClick={() => setShowMore((prev) => !prev)}
          size="sm"
          variant="secondary"
        >
          {showMore ? "Hide extra info" : "Show extra info"}
        </Button>
      </Box>

      {showMore && (
        <Text>
          This is a starter HubSpot card. Customize this component to add your
          own logic, UI, and serverless function calls.
        </Text>
      )}
    </Flex>
  );
};

export default NewAppCard;

