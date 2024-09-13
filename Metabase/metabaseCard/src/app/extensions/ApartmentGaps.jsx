import React, { useEffect, useState, useCallback } from "react";
import {
  hubspot,
  LoadingSpinner,
  Alert,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  Text,
  Button,
  TableBody,
  Heading,
  Flex,
  Divider,
  DescriptionList,
  DescriptionListItem,
  Tag,
} from "@hubspot/ui-extensions";
import { CrmActionButton } from "@hubspot/ui-extensions/crm";
import TableRowComponent from "./components/TableRowComponent";
import BookingStatus from "./components/BookingStatus";

hubspot.extend(({ actions, runServerlessFunction }) => (
  <Extension
    actions={actions}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
  />
));

const Extension = ({ actions, runServerless, fetchProperties }) => {
  const { onCrmPropertiesUpdate, refreshObjectProperties } = actions;

  const [metabaseData, setMetabaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState({});
  const [alert, setAlert] = useState(null);

  const propertiesToFetch = [
    "hs_object_id",
    "backoffice_id",
    "check_in_date",
    "check_out_date",
    // "guest_reservation_id",
    "guest___reservation_id",
    "associated_contact_email",
    "apartment_booked___list",
    "deal____pet_friendly__apt__required",
    // Add other properties you need to fetch
  ];

  useEffect(() => {
    let isMounted = true;

    fetchProperties(propertiesToFetch).then((fetchedProperties) => {
      if (isMounted) {
        setProperties(fetchedProperties);
        fetchMetabaseData();
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);
  console.log("Properties: ", properties);

  onCrmPropertiesUpdate(propertiesToFetch, (updatedProperties) => {
    setProperties(updatedProperties);
  });

  const fetchMetabaseData = async () => {
    try {
      const resp = await runServerless({
        name: "getApartmentGaps",
      });

      if (resp.status === "SUCCESS" && resp.response) {
        let data;
        if (typeof resp.response === "string") {
          try {
            data = JSON.parse(resp.response);
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
            setAlert({ type: "error", message: "Failed to parse Metabase data" });
            setLoading(false);
            return;
          }
        } else {
          data = resp.response;
        }

        if (data && data.metabaseData) {
          setMetabaseData(data.metabaseData);
          console.log("Metabase Data: ", data.metabaseData);
        } else {
          console.warn("No metabaseData found in the response");
          setAlert({ type: "warning", message: "No Metabase data found in the response" });
        }
      } else {
        console.warn("No data returned from fetchMetabaseData");
        setAlert({ type: "warning", message: "No Metabase data found" });
      }
    } catch (error) {
      console.error("Error fetching Metabase data:", error);
      setAlert({ type: "error", message: `Failed to fetch Metabase data: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const updateDealProp = useCallback(
    async (prop_name, prop_value) => {
      try {
        await runServerless({
          name: "updateDealProps",
          parameters: {
            prop_name,
            prop_value,
            dealId: properties.hs_object_id,
            backoffice_id: properties.backoffice_id,
          },
        });
        await refreshObjectProperties();
        setAlert({ type: "success", message: "Property updated successfully" });
      } catch (error) {
        console.error("Error updating deal property:", error);
        setAlert({ type: "error", message: "Failed to update property" });
      }
      setTimeout(() => setAlert(null), 3000);
    },
    [properties.hs_object_id, properties.backoffice_id, refreshObjectProperties, runServerless]
  );

  const getMetabaseValue = (columnName) => {
    if (!metabaseData || !metabaseData.columnNames || !metabaseData.data) return "N/A";
    const index = metabaseData.columnNames.indexOf(columnName);
    return index !== -1 ? metabaseData.data[0][index] : "N/A";
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const adjustedDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  };

  const checkInDate = properties.check_in_date
    ? new Date(parseInt(properties.check_in_date)).toISOString().split("T")[0] // Convert from milliseconds and extract date part
    : null;

  return (
    <>
      {loading && (
        <LoadingSpinner label="Data is loading" showLabel={true} size="md" layout="centered" />
      )}

      {alert && (
        <Alert title={alert.type === "success" ? "Success" : "Error"} variant={alert.type}>
          {alert.message}
        </Alert>
      )}

      {metabaseData && (
        <Flex direction="column" gap="medium">
          <Table bordered={true}>
            <TableHead>
              <TableRow>
                <TableHeader>Codename</TableHeader>
                <TableHeader>Last Check-out</TableHeader>
                <TableHeader>Check-in</TableHeader>
                <TableHeader>Gap</TableHeader>
                <TableHeader>City</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {metabaseData.data
                .filter((row) => {
                  const lastCheckOutDate = formatDate(row[1]); // Format the Last Check-out date

                  // Print both date values to the console
                  console.log("Check-in Date:", checkInDate);
                  console.log("Last Check-out Date:", lastCheckOutDate);

                  return lastCheckOutDate === checkInDate; // Compare with checkInDate
                })
                .map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row[0]}</TableCell>
                    <TableCell>{formatDate(row[1])}</TableCell>
                    <TableCell>{formatDate(row[2])}</TableCell>
                    <TableCell>{row[3]}</TableCell>
                    <TableCell>{row[4]}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Flex>
      )}
    </>
  );
};

export default Extension;
