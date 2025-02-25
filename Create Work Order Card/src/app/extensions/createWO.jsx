import React, { useState, useEffect } from "react";
import {
  Text,
  hubspot,
  Form,
  Input,
  Button,
  Select,
  Flex,
  Alert,
  LoadingSpinner,
  Panel,
  PanelSection,
  PanelBody,
  PanelFooter,
  Heading,
  Divider,
  MultiSelect,
  Link,
} from "@hubspot/ui-extensions";
import { CrmActionButton } from "@hubspot/ui-extensions/crm";

const Extension = ({
  runServerless,
  fetchProperties,
  refreshObjectProperties,
}) => {
  const [description, setDescription] = useState("");
  const [woDescription, setWoDescription] = useState("");
  const [woTroubleshooting, setWoTroubleshooting] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  // const [issueType, setIssueType] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [ticketFiles, setTicketFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [totalIssues, setTotalIssues] = useState([]);
  const [hsObjectId, setHsObjectId] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [ticketOwner, setTicketOwner] = useState("");
  const [bookingID, setBookingID] = useState();
  const [reservationID, setReservationID] = useState("");
  const [apartment, setApartment] = useState([]);
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [alert, setAlert] = useState(null);

  // Fetch initial properties from HubSpot
  useEffect(() => {
    fetchProperties([
      "subject",
      "content",
      "issue_type",
      "hs_object_id",
      "all_issue_type__cloned_",
      "work_order_description",
      "hubspot_owner_id",
      "backoffice_id",
      "reservation_number",
      "apartment_name_list",
      "city",
      "wo_troubleshooting",
      "hs_file_upload",
    ])
      .then((properties) => {
        console.log("Properties fetched:", properties);
        if (properties) {
          setSubject(properties.subject);
          setContent(properties.content);
          setDescription(properties.content);
          // setIssueType(properties.issue_type);
          setHsObjectId(properties.hs_object_id);
          setWoTroubleshooting(properties.wo_troubleshooting);
          setTicketFiles(properties.hs_file_upload);

          const fileOptions = (properties.hs_file_upload || "")
            .split(";")
            .map((file) => ({
              label: file.trim(),
              value: file.trim(),
            }))
            .filter((option) => option.label);
          setSelectedFiles(fileOptions);

          const issueOptions = (properties.all_issue_type__cloned_ || "")
            .split(";")
            .map((issue) => ({
              label: issue.trim(),
              value: issue.trim(),
            }))
            .filter((option) => option.label);
          setTotalIssues(issueOptions);

          setTicketOwner(properties.hubspot_owner_id);
          setBookingID(
            properties.backoffice_id ? properties.backoffice_id : "",
          );
          setReservationID(properties.reservation_number);

          const apartmentName = properties.apartment_name_list
            ? properties.apartment_name_list.split(";")[0].trim()
            : "";
          setApartment(apartmentName);

          setCity(properties.city);
        } else {
          console.error(
            "Error: not all properties found in properties:",
            properties,
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching properties:", error);
      });
  }, [fetchProperties]);

  useEffect(() => {
    console.log("useEffect de issues");
  });

  // Handle button click to fetch WO description and update manually
  const handleCreateWorkOrder = async () => {
    try {
      if (!woDescription || woDescription.length < 10 || !selectedIssue) {
        setIsValid(false);
        return;
      }

      if (!hsObjectId) {
        setIsValid(false);
        return;
      }

      setIsLoading(true);

      const result = await runServerless({
        name: "createWO",
        parameters: {
          description: woDescription,
          issue_type: selectedIssue,
          apartment_name: apartment || "",
          booking_id: bookingID || "",
          city: city || "",
          work_order_requester: ticketOwner || "",
          reservation_id: reservationID || "",
          ticketId: hsObjectId,
          work_order_name: `${bookingID} | ${apartment} | ${selectedIssue}`,
          troubleshooting_message: woTroubleshooting || "",
          uploaded_files: selectedFiles,
        },
      });

      console.log("Respuesta completa:", JSON.stringify(result, null, 2));

      switch (result.status) {
        case "SUCCESS":
          if (result.response?.status === "ERROR") {
            if (
              result.response.error.includes(
                "Authentication credentials not found",
              )
            ) {
              setAlert({
                type: "error",
                message:
                  "Authentication error: Please contact your administrator to verify the API credentials.",
              });
            } else {
              setAlert({
                type: "error",
                message: `Error: ${result.response.error}`,
              });
            }
            setIsValid(false);
            setIsLoading(false);
            return;
          }

          const workOrderId = result.response?.response?.id;
          const workOrderProperties = result.response?.response?.properties;

          console.log("Work Order creada:", {
            id: workOrderId,
            properties: workOrderProperties,
          });

          setAlert({
            type: "success",
            message: `Work order successfully created. ID: ${workOrderId}`,
          });
          setIsValid(true);
          setWoDescription("");
          setWoTroubleshooting("");
          // setIssueType("");
          refreshObjectProperties();
          setIsLoading(false);
          break;

        case "WARNING":
          const warningId = result.response?.response?.id;
          const errorMessage =
            result.error || result.response?.error || "Desconocido";

          setAlert({
            type: "warning",
            message: `Work order created but there was a problem with the association. ID: ${warningId}. Error: ${errorMessage}`,
          });
          setIsValid(true);
          refreshObjectProperties();
          setIsLoading(false);
          break;

        case "ERROR":
          setIsLoading(false);
          setAlert({
            type: "error",
            message: `Error: ${result.error || "Error desconocido al crear la work order"}`,
          });
          throw new Error(result.error || "Error creating work order");

        default:
          setIsLoading(false);
          setAlert({
            type: "error",
            message: "Unknown server response",
          });
          throw new Error("Unknown server response");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error detallado:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });

      setAlert({
        type: "error",
        message: `Error: ${error.message || "Error desconocido al crear la work order"}`,
      });
      setIsValid(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* <Text>Hello World</Text>
      <Text>{description}</Text>
      <Text>{subject}</Text> */}

      {alert && <Alert variant={alert.type}>{alert.message}</Alert>}

      <Flex
        direction={"column"}
        justify={"between"}
        wrap={"wrap"}
        gap={"small"}
      >
        <Select
          label="Select Work Order's Issue"
          name="issueSelect"
          tooltip="Issue to create a work order from"
          description="Select Issue"
          placeholder=""
          required={true}
          error={!isValid}
          validationMessage={validationMessage}
          onChange={(value) => {
            setSelectedIssue(value);
            if (!value) {
              setValidationMessage("This is required");
              setIsValid(false);
            } else {
              setValidationMessage("Excellent!");
              setIsValid(true);
            }
          }}
          options={totalIssues}
        />
        <Button
          disabled={!selectedIssue}
          overlay={
            <Panel id="my-panel" title="Example panel">
              <PanelBody>
                <PanelSection>
                  <Heading format={{ fontWeight: "bold" }}>
                    Create a new Work Order for "{selectedIssue || "selected"}"
                    issue
                  </Heading>
                  <Divider />
                  {isLoading ? (
                    <LoadingSpinner label="Creating Work Order..." />
                  ) : (
                    <Form>
                      <Input
                        label="Work Order Description"
                        name={woDescription}
                        tooltip="Define the description of the work order"
                        description="Please enter your work order description (minimum 10 characters)"
                        placeholder="Work order description"
                        required={true}
                        error={
                          woDescription !== "" && woDescription.length < 10
                        }
                        validationMessage={
                          woDescription !== "" && woDescription.length < 10
                            ? "Description must be at least 10 characters"
                            : ""
                        }
                        onChange={(value) => {
                          setWoDescription(value);
                        }}
                        onInput={(value) => {
                          setWoDescription(value);
                          setIsValid(value.length >= 10);
                        }}
                      />
                      <Input
                        label="Troubleshooting message"
                        name="troubleshooting_message"
                        value={woTroubleshooting}
                        placeholder="Work order description"
                        required={true}
                        onChange={(value) => {
                          setWoTroubleshooting(value);
                        }}
                      />
                      <Input
                        label="Booking ID"
                        name="booking_id"
                        value={bookingID || ""}
                        placeholder=""
                        required={true}
                        onChange={(value) => {
                          setBookingID(value);
                        }}
                      />
                      <Input
                        label="Reservation ID"
                        name="reservation_id"
                        value={reservationID || ""}
                        placeholder="Work order description"
                        required={true}
                        onChange={(value) => {
                          setReservationID(value);
                        }}
                      />
                      <Input
                        label="Work Order Requester"
                        name="work_order_requester"
                        value={ticketOwner || ""}
                        placeholder="Work order description"
                        required={true}
                        onChange={(value) => {
                          setTicketOwner(value);
                        }}
                      />
                      <Input
                        label="Apartment name"
                        name="apartment_name"
                        value={apartment || ""}
                        placeholder="Work order description"
                        required={true}
                        onChange={(value) => {
                          setApartment(value);
                        }}
                      />
                      <Input
                        label="City"
                        name="city"
                        value={city}
                        placeholder="Work order description"
                        required={true}
                        onChange={(value) => {
                          setCity(value);
                        }}
                      />
                    </Form>
                  )}
                  <Flex
                    direction={"column"}
                    justify={"between"}
                    wrap={"wrap"}
                    gap={"small"}
                  >
                    <Button
                      onClick={handleCreateWorkOrder}
                      variant="primary"
                      size="md"
                      type="submit"
                      disabled={
                        !selectedIssue ||
                        !woDescription ||
                        woDescription.length < 10 ||
                        !woTroubleshooting ||
                        !bookingID ||
                        !reservationID ||
                        !ticketOwner ||
                        !apartment ||
                        !city
                      }
                    >
                      Create new Work Order
                    </Button>
                  </Flex>
                </PanelSection>
              </PanelBody>
              <PanelFooter></PanelFooter>
            </Panel>
          }
        >
          Request a Work Order
        </Button>
      </Flex>
    </>
  );
};

// Define the HubSpot UI extension entry point
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
    refreshObjectProperties={actions.refreshObjectProperties}
  />
));
