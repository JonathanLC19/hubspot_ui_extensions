import React from "react";
import { Text, Button, Flex, hubspot } from "@hubspot/ui-extensions";

// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, actions }) => (
  <CreateContactForm
    context={context}
    addAlert={actions.addAlert}
  />
));

const GetDeal = ({ context, addAlert }) => {
  const [name, setName] = React.useState('');
  const [pipeline, setPipeline] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);

    try {
      const result = await hubspot.serverless('app_function_private', {
        parameters: { dealname, pipeline, dealstage }
      });

      if (result.body.success) {
        addAlert({
          title: "Deal successfully fetched",
          message: `Deal ID: ${result.body.dealId}`,
          type: "success"
        });
      } else {
        addAlert({
          title: "Error fetching deal",
          message: result.body.error,
          type: "danger"
        });
      }
    } catch (error) {
      addAlert({
        title: "Error fetching deal",
        message: error.message,
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };
}

// Define the Extension component
const Extension = () => {
  return (
    <Flex direction="column" gap="medium">
      <Text>This is a simple getting started UI extension with static text.</Text>
      <Button onClick={handleFetch} disabled={loading}>{loading ? "Fetching..." : "Fetch"}</Button>
    </Flex>
  );
};