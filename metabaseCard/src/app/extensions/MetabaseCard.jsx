import React, { useEffect, useState } from 'react';
import {
  LoadingSpinner,
  Text,
  Panel,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Heading,
  hubspot,
  Button
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

  console.log("Rendering metabaseData:", JSON.stringify(metabaseData, null, 2));

  console.log("Rendering component with state:", {
    backofficeId,
    metabaseId: metabaseData.metabaseId,
    columnCount: metabaseData.columnNames.length,
    dataRowCount: metabaseData.data.length,
    firstRowSample: metabaseData.data[0].slice(0, 5) // First 5 items of the first row
  });

  return (
    <>
      <Heading>Metabase Data</Heading>
      <Text>
        HubSpot Backoffice ID: {backofficeId}
      </Text>
      <Text>
        Metabase ID: {metabaseData.metabaseId}
      </Text>
      <Text>Number of columns: {metabaseData.columnNames.length}</Text>
      <Text>Number of data rows: {metabaseData.data.length}</Text>
      <Heading>First Row Data:</Heading>
      {metabaseData.data[0].map((cell, index) => (
        <Text key={index}>
          {metabaseData.columnNames[index]}: {cell !== null && cell !== undefined ? cell.toString() : 'N/A'}
        </Text>
      ))}
      <CrmActionButton
        actionType="EXTERNAL_URL"
        actionContext={{
          href: 'https://prod.backoffice.ukio.com/bookings/?id=' + metabaseData.metabaseId,
        }}
        variant="secondary"
    >
      See in Backoffice
    </CrmActionButton>
    </>
  );
};

export default Extension;