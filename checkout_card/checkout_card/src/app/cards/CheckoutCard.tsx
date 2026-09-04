import { useEffect, useState } from "react";
import {
  CrmPropertyList,
  useCrmProperties
} from "@hubspot/ui-extensions/crm";
import {
  Text,
  Button,
  Flex,
  Box,
  Alert,
  Select,
  Inline,
  Divider,
  Heading,
  LoadingSpinner,
  Spacer,
  DescriptionList,
  DescriptionListItem,
  hubspot
} from "@hubspot/ui-extensions";

hubspot.extend<"crm.record.tab">(({ context, actions }) => (
  <Extension
    context={context}
    refreshObjectProperties={actions.refreshObjectProperties}
  />
));

type School = {
  name: string;
  lwclient_id: string;
  url?: string;
};

const MAX_POLL_ATTEMPTS = 15;
const POLL_DELAY = 2000;
const CHECKOUT_ERROR_VALUE = "No URL created";

const Extension = ({ context, refreshObjectProperties }) => {
  const { properties } = useCrmProperties([
    "school_id",
    "school_url",
    "checkout_link__school_url",
    "plan",
    "deal_currency_code",
    "amount",
    "create_checkout_link",
    "chargebee_customer_id",
    "chargebee_checkout_link_lw",
    "discount_coupon_applied",
    "coupons_list",
    "checkout_link__create_date"
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [schoolUrl, setSchoolUrl] = useState("");

  const [schoolValidationMessage, setSchoolValidationMessage] =
    useState("");
  const [checkoutStatusMessage, setCheckoutStatusMessage] =
    useState("");

  const [isSchoolValid, setIsSchoolValid] = useState(true);

  const checkoutLink =
    properties?.chargebee_checkout_link_lw?.trim() ?? "";

  const checkoutLinkFailed =
    checkoutLink === CHECKOUT_ERROR_VALUE;

  const hasCheckoutLink =
    Boolean(checkoutLink) && !checkoutLinkFailed;

  const hasCustomer =
    Boolean(properties?.chargebee_customer_id);

  const missingInfo = Boolean(
    !properties?.school_id ||
    !properties?.checkout_link__school_url ||
    !properties?.plan ||
    !properties?.deal_currency_code ||
    !properties?.amount
  );

  /*
   * Poll the CRM record while the checkout link is being created.
   *
   * Polling stops when:
   * 1. A Chargebee customer is detected.
   * 2. A valid URL is returned.
   * 3. "No URL created" is returned.
   * 4. The maximum number of attempts is reached.
   */
  useEffect(() => {
    if (!isLoading) {
      return;
    }

    // Stop polling if a Chargebee customer was created or detected.
    if (hasCustomer) {
      setIsLoading(false);
      setPollAttempts(0);
      setCheckoutStatusMessage("");
      return;
    }

    // Stop polling when Chargebee reports a failure.
    if (checkoutLinkFailed) {
      setIsLoading(false);
      setPollAttempts(0);
      setCheckoutStatusMessage("");
      return;
    }

    // Stop polling when a valid checkout link is available.
    if (hasCheckoutLink) {
      setIsLoading(false);
      setPollAttempts(0);
      setCheckoutStatusMessage("");
      return;
    }

    // Only show the timeout warning if no terminal result exists.
    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      setIsLoading(false);
      setPollAttempts(0);

      setCheckoutStatusMessage(
        "The checkout link is still being created. Refresh the record shortly."
      );

      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        await refreshObjectProperties();
      } catch (error) {
        console.error(
          "Error refreshing properties:",
          error
        );
      } finally {
        setPollAttempts((currentAttempts) => {
          return currentAttempts + 1;
        });
      }
    }, POLL_DELAY);

    return () => clearTimeout(timeoutId);
  }, [
    isLoading,
    hasCustomer,
    checkoutLinkFailed,
    hasCheckoutLink,
    pollAttempts,
    refreshObjectProperties
  ]);

  const isDisabled =
    missingInfo ||
    hasCustomer ||
    hasCheckoutLink ||
    isLoading;

  const getSchoolIDs = async () => {
    try {
      const dealId = context.crm.objectId;

      const result = await hubspot.serverless(
        "get_school_ids",
        {
          parameters: {
            objectId: dealId
          }
        }
      );

      console.log("Serverless result:", result);

      const schoolData = result?.data ?? [];

      setSchools(
        Array.isArray(schoolData) ? schoolData : []
      );
    } catch (error) {
      console.error(
        "Error retrieving schools:",
        error
      );

      setSchools([]);
    }
  };

  useEffect(() => {
    getSchoolIDs();
  }, []);

  const setSchoolID = async () => {
    if (!selectedSchool) {
      setSchoolValidationMessage(
        "This is required"
      );
      setIsSchoolValid(false);
      return;
    }

    if (!schoolUrl) {
      setSchoolValidationMessage(
        "The selected school has no URL"
      );
      setIsSchoolValid(false);
      return;
    }

    const formattedSchoolUrl =
      /^https?:\/\//i.test(schoolUrl)
        ? schoolUrl
        : `https://${schoolUrl}`;

    try {
      const dealId = context.crm.objectId;

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "school_id",
            value: selectedSchool
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "checkout_link__school_url",
            value: formattedSchoolUrl
          }
        }
      );

      await refreshObjectProperties();

      setSchoolValidationMessage(
        "School ID and URL fetched successfully"
      );
      setIsSchoolValid(true);
    } catch (error) {
      console.error(
        "Error updating school:",
        error
      );

      setSchoolValidationMessage(
        "Could not update the school"
      );
      setIsSchoolValid(false);
    }
  };

  const updatePricing = async () => {
    const dealId = context.crm.objectId;
    if (properties.plan === "learning_center_299") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 299
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "USD"
          }
        }
      );
    };
    if (properties.plan === "learning_center_299_EUR") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 299
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "EUR"
          }
        }
      );
    };
    if (properties.plan === "learning_center_yearly_3") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 249
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "USD"
          }
        }
      );
    };
    if (properties.plan === "learning_center_yearly_3_EUR") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 249
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "EUR"
          }
        }
      );
    };
    if (properties.plan === "pro-EUR-Monthly") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 99
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "EUR"
          }
        }
      );
    };
    if (properties.plan === "pro") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 99
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "USD"
          }
        }
      );
    };
    if (properties.plan === "pro_yearly_2") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 79
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "USD"
          }
        }
      );
    };
    if (properties.plan === "pro_yearly_2_EUR") {
      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "amount",
            value: 79
          }
        }
      );

      await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName: "deal_currency_code",
            value: "EUR"
          }
        }
      );
    };
    await refreshObjectProperties();
  };

  useEffect(() => {
    updatePricing();
  }, [properties.plan]);

  const handleClick = async () => {
    const dealId = context.crm.objectId;

    try {
      setCheckoutStatusMessage("");
      setPollAttempts(0);
      setIsLoading(true);

      /*
       * Clear a previous URL or "No URL created" value.
       *
       * This prevents the polling effect from immediately
       * detecting the result from the previous attempt.
       */

      const result = await hubspot.serverless(
        "checkout_card_app_function",
        {
          parameters: {
            objectId: dealId,
            propertyName:
              "create_checkout_link",
            value: "true"
          }
        }
      );

      if (result?.success === false) {
        throw new Error(
          result.error ??
          "Could not trigger checkout-link creation"
        );
      }

      await refreshObjectProperties();
    } catch (error) {
      console.error(
        "Error creating checkout link:",
        error
      );

      setIsLoading(false);
      setPollAttempts(0);
      setCheckoutStatusMessage(
        "The checkout-link request could not be started. Please try again."
      );
    }
  };

  /*
   * EXPIRATION DATE CALCULATION
   */
  const LINK_VALIDITY_DAYS = 14;

  const checkoutLinkCreatedDate =
    properties?.checkout_link__create_date;
  console.log("checkoutLinkCreatedDate", checkoutLinkCreatedDate);

  const getDaysLeft = () => {
    if (!checkoutLinkCreatedDate) return null;

    const timestamp = Number(checkoutLinkCreatedDate);

    if (Number.isNaN(timestamp)) {
      return null;
    }

    const createdDate = new Date(timestamp);

    const expiryDate = new Date(
      createdDate.getTime() +
      LINK_VALIDITY_DAYS * 24 * 60 * 60 * 1000
    );

    const now = new Date();

    const millisecondsLeft =
      expiryDate.getTime() - now.getTime();

    return Math.max(
      0,
      Math.ceil(
        millisecondsLeft / (1000 * 60 * 60 * 24)
      )
    );
  };

  const daysLeft = getDaysLeft();

  return (
    <Flex direction="column" gap="medium">
      <Text>
        Select the school and click on "Set
        School" to save the school ID and URL.
        Then revise or fill in the amount,
        currency and plan to create the checkout
        link. A discount coupon is optional.
      </Text>

      {hasCustomer ? (
        <Alert
          title="Chargebee Customer Exists"
          variant="warning"
        >
          <Text>
            A checkout link cannot be created
            because this deal already has a
            Chargebee customer.
          </Text>
        </Alert>
      ) : missingInfo ? (
        <Alert
          title="Missing Info"
          variant="warning"
        >
          <Text>
            Select a school and fill in all the
            required fields.
          </Text>
        </Alert>
      ) : checkoutLinkFailed ? (
        <Alert
          title="Checkout Link Creation Failed"
          variant="danger"
        >
          <Text>
            Chargebee could not create the
            checkout link. Review the customer,
            plan, amount, currency and coupon
            information, then try again.
          </Text>
        </Alert>
      ) : hasCheckoutLink ? (
        <Alert
          title="Checkout Link Created"
          variant="success"
        >
          <Text>
            The checkout link has been created.
          </Text>
        </Alert>
      ) : null}

      {checkoutStatusMessage && (
        <Alert
          title="Checkout Link"
          variant="warning"
        >
          <Text>{checkoutStatusMessage}</Text>
        </Alert>
      )}

      <Heading>Step 1 - Select School</Heading>

      <Inline
        gap="medium"
        align="center"
        justify="center"
      >
        <Box alignSelf="center">
          <Select
            required={true}
            name="school"
            placeholder="Select School"
            options={schools.map((school) => ({
              value: school.lwclient_id,
              label: school.url
            }))}
            onChange={(value) => {
              const schoolId = String(value);

              const selectedSchoolRecord =
                schools.find(
                  (school) =>
                    school.lwclient_id ===
                    schoolId
                );

              const selectedSchoolUrl =
                selectedSchoolRecord?.url ?? "";

              setSelectedSchool(schoolId);
              setSchoolUrl(selectedSchoolUrl);

              if (!schoolId) {
                setSchoolValidationMessage(
                  "This is required"
                );
                setIsSchoolValid(false);
              } else {
                setSchoolValidationMessage("");
                setIsSchoolValid(true);
              }
            }}
            validationMessage={
              schoolValidationMessage
            }
            error={!isSchoolValid}
          />
        </Box>

        <Box alignSelf="center">
          <Button
            disabled={!selectedSchool}
            onClick={setSchoolID}
            variant="secondary"
            size="medium"
          >
            Set School
          </Button>
        </Box>
      </Inline>

      {selectedSchool && (
        <Box>
          <CrmPropertyList
            properties={[
              "school_id",
              "checkout_link__school_url"
            ]}
            direction="row"
          />
        </Box>
      )}

      <Divider />

      <Heading>
        Step 2 - Fill all the details and create
        the checkout link
      </Heading>

      <Box>
        <CrmPropertyList
          properties={[
            "plan",
            "coupons_list"
          ]}
          direction="row"
        />
        {properties.plan &&
          <>
            <Divider />
            <DescriptionList direction="row">
              <DescriptionListItem label={"Currency"}>
                <Text>{properties.deal_currency_code}</Text>
              </DescriptionListItem>
              <DescriptionListItem label="Amount">
                <Text>{properties.amount}</Text>
              </DescriptionListItem>
            </DescriptionList>
          </>
        }
      </Box>

      <Box alignSelf="center">
        <Button
          disabled={isDisabled}
          onClick={handleClick}
          variant="primary"
          size="medium"
        >
          {checkoutLinkFailed
            ? "Retry Checkout Link"
            : "Create Checkout Link"}
        </Button>
      </Box>

      {isLoading &&
        !hasCustomer &&
        !checkoutLinkFailed &&
        !hasCheckoutLink && (
          <LoadingSpinner
            label={`Fetching checkout link... Attempt ${pollAttempts + 1
              } of ${MAX_POLL_ATTEMPTS}`}
            showLabel={true}
            layout="centered"
            size="medium"
          />
        )}

      {hasCheckoutLink && (
        <Box>
          <Divider />

          <Heading>Checkout Link</Heading>

          <Spacer size="small" />

          <Alert
            title="Warning"
            variant="warning"
          >
            <Text>
              {daysLeft !== null
                ? `This link will be deleted in ${daysLeft} ${daysLeft === 1 ? "day" : "days"
                }.`
                : "This link will be deleted within 14 days of creation. FIXED timestamp."}
            </Text>
          </Alert>

          <Spacer size="medium" />

          <Text>{checkoutLink}</Text>
        </Box>
      )}
    </Flex>
  );
};