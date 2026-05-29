import React from "react";
import { Text, Button, Flex, hubspot } from "@hubspot/ui-extensions";

// Define the extension to be run within the Hubspot CRM
hubspot.extend(() => <Extension />);

// Define the Extension component
const Extension = () => {
  return (
    <Flex direction="column" gap="medium">
      <Text>This is a simple getting started UI extension with static text.</Text>
      <Button onClick={() => console.log("Button clicked!")}>Click me!</Button>
    </Flex>
  );
};