import React, { useState, useEffect } from "react";
import { Text, Tag, Flex } from "@hubspot/ui-extensions";

const BookingStatus = ({ prop_value_1 }) => {
  const [bookingStatus, setBookingStatus] = useState({ variant: "default", message: "Unknown" });

  useEffect(() => {
    if (prop_value_1 === "waiting_transfer_receipt_validation") {
      setBookingStatus({ variant: "warning", message: "Waiting transfer receipt validation" });
    } else if (prop_value_1 === "waiting_transfer_payment") {
      setBookingStatus({ variant: "warning", message: "Waiting transfer payment" });
    } else if (prop_value_1 === "waiting_installment") {
      setBookingStatus({ variant: "warning", message: "Waiting installment" });
    } else if (prop_value_1 === "waiting_id") {
      setBookingStatus({ variant: "warning", message: "Waiting ID" });
    } else if (prop_value_1 === "waiting_form") {
      setBookingStatus({ variant: "warning", message: "Waiting form" });
    } else if (prop_value_1 === "waiting_approval") {
      setBookingStatus({ variant: "warning", message: "Waiting approval" });
    } else if (prop_value_1 === "id_rejected") {
      setBookingStatus({ variant: "error", message: "ID Rejected" });
    } else if (prop_value_1 === "denied") {
      setBookingStatus({ variant: "error", message: "Denied" });
    } else if (prop_value_1 === "canceled") {
      setBookingStatus({ variant: "error", message: "Canceled" });
    } else if (prop_value_1 === "approved") {
      setBookingStatus({ variant: "success", message: "Approved" });
    }
  }, [prop_value_1]);
  console.log("status", bookingStatus);
  return (
    <Flex direction="row" gap="small">
      <Text format={{ fontWeight: "bold" }}>Booking Status:</Text>
      {bookingStatus && <Tag variant={bookingStatus.variant}>{bookingStatus.message}</Tag>}
    </Flex>
  );
};

export default BookingStatus;
