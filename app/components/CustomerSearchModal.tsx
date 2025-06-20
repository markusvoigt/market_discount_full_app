import {
  Modal,
  TextField,
  BlockStack,
  Spinner,
  ResourceList,
  ResourceItem,
  Text,
  Avatar,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

interface CustomerSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selection: any[]) => void;
  resourceType: "customer" | "customer_segment";
}

export function CustomerSearchModal({
  open,
  onClose,
  onSelect,
  resourceType,
}: CustomerSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSearch = useCallback(
    async (value: string) => {
      setQuery(value);
      if (value.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const resource =
        resourceType === "customer" ? "customers" : "customer-segments";
      const response = await fetch(`/api/search-${resource}?query=${value}`);
      const { customers, customerSegments } = await response.json();
      setResults(customers || customerSegments);
      setLoading(false);
    },
    [resourceType],
  );

  const handleSave = () => {
    const selection = results.filter((result) =>
      selectedItems.includes(result.id),
    );
    onSelect(selection);
    onClose();
  };

  const resourceName = {
    singular: resourceType === "customer" ? "customer" : "customer segment",
    plural: resourceType === "customer" ? "customers" : "customer segments",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Select ${resourceName.plural}`}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Search"
            value={query}
            onChange={handleSearch}
            autoComplete="off"
          />
          {loading ? (
            <Spinner />
          ) : (
            <ResourceList
              resourceName={resourceName}
              items={results}
              renderItem={(item) => {
                const { id, name, displayName, email } = item;
                const media = <Avatar customer size="md" name={displayName || name} />;

                return (
                  <ResourceItem
                    id={id}
                    onClick={() => {}}
                    media={media}
                    accessibilityLabel={`View details for ${
                      displayName || name
                    }`}
                  >
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {displayName || name}
                    </Text>
                    {email && <div>{email}</div>}
                  </ResourceItem>
                );
              }}
              selectedItems={selectedItems}
              onSelectionChange={(items) => {
                if (items === "All") {
                  setSelectedItems(results.map((r) => r.id));
                } else {
                  setSelectedItems(items);
                }
              }}
              promotedBulkActions={[
                {
                  content: 'Select All',
                  onAction: () => setSelectedItems(results.map((r) => r.id)),
                },
              ]}
            />
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 