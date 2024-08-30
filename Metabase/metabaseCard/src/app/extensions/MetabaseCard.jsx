import React, { useEffect, useState } from 'react';
import {
  LoadingSpinner,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Heading,
  hubspot,
  Flex,
  Box
} from '@hubspot/ui-extensions';
import { CrmActionButton } from '@hubspot/ui-extensions/crm';

hubspot.extend(({ runServerlessFunction, actions }) => (
  <Extension 
    runServerless={runServerlessFunction} 
    fetchProperties={actions.fetchCrmObjectProperties} 
  />
));

const Extension = ({ runServerless, fetchProperties }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metabaseData, setMetabaseData] = useState(null);
  const [backofficeId, setBackofficeId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching properties...");
        const properties = await fetchProperties(['backoffice_id']);
        console.log("Fetched properties:", properties);
        const backofficeId = properties.backoffice_id;
        setBackofficeId(backofficeId);
        console.log("Fetched backoffice_id:", backofficeId);

        if (!backofficeId) {
          throw new Error("Backoffice ID is missing. Please ensure the deal has a valid Backoffice ID.");
        }

        console.log("Running serverless function...");
        const result = await runServerless({ 
          name: 'getMetabaseData', 
          parameters: { 
            backoffice_id: backofficeId 
          } 
        });
        console.log("Serverless function result:", JSON.stringify(result, null, 2));
        
        if (result.status === 'SUCCESS' && result.response && result.response.metabaseData) {
          console.log("Setting metabaseData:", JSON.stringify(result.response.metabaseData, null, 2));
          setMetabaseData(result.response.metabaseData);
        } else {
          throw new Error(result.response?.error || "Failed to fetch Metabase data");
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchProperties, runServerless]);

  console.log("Component re-rendered. State:", { isLoading, error, backofficeId, metabaseData });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (!metabaseData) {
    return <Text>No Metabase data available.</Text>;
  }

  // Helper function to get value from metabaseData
  const getValue = (key) => {
    const index = metabaseData.columnNames.indexOf(key);
    return index !== -1 ? (metabaseData.data[0][index] !== null && metabaseData.data[0][index] !== undefined ? metabaseData.data[0][index].toString() : 'N/A') : 'N/A';
  };

  return (
    <>
    <Heading>Booking Data</Heading>
    <Flex direction={"row"} justify={'between'} wrap={'wrap'} gap={'medium'}>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Check-in Date</Text>
        <Text>{getValue('check_in')}</Text>
      </Box>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Check-out Date</Text>
        <Text>{getValue('check_out')}</Text>
      </Box>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Apartment</Text>
        <Text>{getValue('codename')}</Text>
      </Box>
    </Flex>
    <Flex direction={"row"} justify={'between'} wrap={'wrap'} gap={'large'}>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Guest Email</Text>
        <Text>{getValue('email')}</Text>
      </Box>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Guest Name</Text>
        <Text>{getValue('name')}</Text>
      </Box>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Guest Last Name</Text>
        <Text>{getValue('last_name')}</Text>
      </Box>
    </Flex>
    <Flex direction={"row"} justify={'between'} wrap={'wrap'} gap={'large'}>
      <Box>
        <Text format={{ fontWeight: 'bold'  }}>BO | Guest Phone</Text>
        <Text>{getValue('phone')}</Text>
      </Box>
    </Flex>

      <Text>HubSpot Backoffice ID: {backofficeId}</Text>
      <Text>Metabase ID: {metabaseData.metabaseId}</Text>
      
      <CrmActionButton
        actionType="EXTERNAL_URL"
        actionContext={{
          href: 'https://prod.backoffice.ukio.com/bookings/?id=' + metabaseData.metabaseId,
        }}
        variant="primary"
      >
        View in Backoffice
      </CrmActionButton>
    </>
  );
};

export default Extension;
