import {
  Card,
  Checkbox,
  Text,
  TextField,
  BlockStack,
} from "@shopify/polaris";

export function UsageLimitsCard({
  totalUsageLimit,
  oncePerCustomer,
  onUsageLimitChange,
  onOncePerCustomerChange,
}: {
  totalUsageLimit: string;
  oncePerCustomer: boolean;
  onUsageLimitChange: (value: string) => void;
  onOncePerCustomerChange: (checked: boolean) => void;
}) {
  return (
    <Card>
      <BlockStack gap="300">
        <Text variant="headingMd" as="h2">
          Usage limits
        </Text>
        <TextField
          label="Total usage limit"
          helpText="Limit the number of times this discount can be used in total."
          value={totalUsageLimit}
          onChange={onUsageLimitChange}
          autoComplete="off"
        />
        <Checkbox
          label="Limit to one use per customer"
          checked={oncePerCustomer}
          onChange={onOncePerCustomerChange}
        />
      </BlockStack>
    </Card>
  );
} 