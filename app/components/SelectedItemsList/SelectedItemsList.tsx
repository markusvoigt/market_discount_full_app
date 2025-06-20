import React from 'react';
import { Tag, BlockStack, InlineStack, Bleed, Box } from '@shopify/polaris';

interface Item {
  id: string;
  [key: string]: any;
}

interface SelectedItemsListProps<T extends Item> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onRemoveItem: (id: string) => void;
}

export function SelectedItemsList<T extends Item>({
  items,
  renderItem,
  onRemoveItem,
}: SelectedItemsListProps<T>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Bleed marginInline="400">
      <Box padding="400" background="bg-surface-secondary">
        <BlockStack gap="200">
          {items.map((item) => (
            <InlineStack key={item.id} wrap={false} gap="200" blockAlign="center">
              <div style={{ flexGrow: 1 }}>{renderItem(item)}</div>
              <Tag onRemove={() => onRemoveItem(item.id)}>{item.name || item.id}</Tag>
            </InlineStack>
          ))}
        </BlockStack>
      </Box>
    </Bleed>
  );
} 