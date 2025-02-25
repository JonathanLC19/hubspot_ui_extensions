import {
  CrmActionButton,
  CrmActionLink,
  CrmCardActions,
} from "@hubspot/ui-extensions/crm";

<CrmActionButton
  actionType="OPEN_RECORD_ASSOCIATION_FORM"
  actionContext={{
    objectTypeId: "0-2",
    association: {
      objectTypeId: "0-1",
      objectId: 123456,
    },
  }}
>
  Create new record
</CrmActionButton>;
