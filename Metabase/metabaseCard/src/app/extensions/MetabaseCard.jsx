import React, { useEffect, useState, useCallback } from "react";
import {
  hubspot,
  LoadingSpinner,
  Alert,
  Table,
  TableRow,
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
  const [cardId, setCardId] = useState(1876); // Add state for cardId

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
        fetchMetabaseData(fetchedProperties.backoffice_id);
      }
    });

    // Set up the onCrmPropertiesUpdate listener only once
    onCrmPropertiesUpdate(propertiesToFetch, (updatedProperties) => {
      setProperties(updatedProperties);
    });

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only on mount
  console.log("Properties: ", properties);

  const fetchMetabaseData = async (backofficeId) => {
    if (!backofficeId) {
      console.error("backoffice_id is missing");
      setAlert({ type: "error", message: "Failed to fetch Metabase data: Missing backoffice_id" });
      setLoading(false);
      return;
    }

    try {
      const resp = await runServerless({
        name: "getMetabaseData",
        parameters: { backoffice_id: backofficeId, card_id: cardId }, // Pass cardId as a parameter
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
          <Flex>
            <DescriptionList direction={"row"}>
              <DescriptionListItem label="HubSpot Booking ID">
                <Text>{properties.backoffice_id || "N/A"}</Text>
              </DescriptionListItem>
              <DescriptionListItem label="BO Booking ID">
                <Text>{metabaseData.metabaseId || "N/A"}</Text>
              </DescriptionListItem>
            </DescriptionList>
            <DescriptionList direction={"row"}>
              <DescriptionListItem label="HubSpot Contact Email">
                <Text>{properties.associated_contact_email || "N/A"}</Text>
              </DescriptionListItem>
              <DescriptionListItem label="BO Guest Email">
                <Text>{getMetabaseValue("email") || "N/A"}</Text>
              </DescriptionListItem>
            </DescriptionList>
          </Flex>
          <BookingStatus prop_value_1={getMetabaseValue("state")} />
          <Flex direction="row">
            {metabaseData.metabaseId && (
              <CrmActionButton
                actionType="EXTERNAL_URL"
                actionContext={{
                  href: "https://prod.backoffice.ukio.com/bookings/?id=" + metabaseData.metabaseId,
                }}
                variant="primary"
              >
                View in Backoffice
              </CrmActionButton>
            )}
          </Flex>
          <Divider />
          <Heading size="large">Booking Details</Heading>
          <Flex>
            <Table bordered={false}>
              <TableBody>
                <TableRowComponent
                  prop_name_1="Check-in"
                  prop_value_1={getMetabaseValue("check_in")}
                  prop_value_2={properties.check_in_date}
                  prop_label="check_in_date"
                  updateDealProp={updateDealProp}
                />
                {/* Add more TableRowComponents for other properties */}
                <TableRowComponent
                  prop_name_1="Check-out"
                  prop_value_1={getMetabaseValue("check_out")}
                  prop_value_2={properties.check_out_date}
                  prop_label="check_out_date"
                  updateDealProp={updateDealProp}
                />
                <TableRowComponent
                  prop_name_1="Guest ID"
                  prop_value_1={getMetabaseValue("code")}
                  prop_value_2={properties.guest___reservation_id}
                  // prop_value_2={properties.guest_reservation_id}
                  prop_label="guest___reservation_id"
                  updateDealProp={updateDealProp}
                />
                <TableRowComponent
                  prop_name_1="Apartment Name"
                  prop_value_1={getMetabaseValue("codename")}
                  prop_value_2={properties.apartment_booked___list}
                  prop_label="apartment_booked___list"
                  updateDealProp={updateDealProp}
                />
                <TableRowComponent
                  prop_name_1="Pets"
                  prop_value_1={getMetabaseValue("pets") ? "Yes" : "No"}
                  prop_value_2={properties.deal____pet_friendly__apt__required}
                  prop_label="deal____pet_friendly__apt__required"
                  updateDealProp={updateDealProp}
                />
              </TableBody>
            </Table>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default Extension;
