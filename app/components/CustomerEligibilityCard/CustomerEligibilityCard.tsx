import React from 'react';
import {
  Box,
  Card,
  ChoiceList,
  Text,
  BlockStack,
  Link,
  Checkbox,
} from '@shopify/polaris';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {Eligibility} from '../../constants';
import type { Customer, CustomerSegment } from '../../types/types';
import type { Field } from '../../types/form.types';
import {SelectedItemsList} from '../SelectedItemsList';

import styles from './CustomerEligibilityCard.module.scss';

export interface CustomerEligibilityCardProps {
  /**
   * Controls whether the discount is applied to all customers, specific customers, or specific customer groups
   */
  eligibility: Field<Eligibility>;

  /**
   * Widget that enables users to select customers (see docs for an example)
   */
  customerSelector: React.ReactNode;

  /**
   * List of customers that the discount will be applied to
   */
  selectedCustomers: Field<Customer[]>;

  /**
   * Widget that enables users to select customer segments (see docs for an example)
   */
  customerSegmentSelector: React.ReactNode;

  /**
   * List of customer segments that the discount will be applied to
   */
  selectedCustomerSegments: Field<CustomerSegment[]>;
}

export function CustomerEligibilityCard({
  eligibility,
  customerSelector,
  selectedCustomers,
  customerSegmentSelector,
  selectedCustomerSegments,
}: CustomerEligibilityCardProps) {
  const isSpecific = eligibility.value !== Eligibility.Everyone;

  const handleToggle = (checked: boolean) => {
    eligibility.onChange(
      checked ? Eligibility.Customers : Eligibility.Everyone,
    );
  };

  return (
    <Box paddingBlockEnd="400">
      <Card padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            Customer eligibility
          </Text>
          <Checkbox
            label="Limit to specific customers or customer segments"
            checked={isSpecific}
            onChange={handleToggle}
          />
          {isSpecific && (
            <Box paddingInlineStart="400">
              <ChoiceList
                title="Customer eligibility"
                titleHidden
                selected={[eligibility.value]}
                choices={[
                  {
                    label: 'Specific customer segments',
                    value: Eligibility.CustomerSegments,
                  },
                  {
                    label: 'Specific customers',
                    value: Eligibility.Customers,
                  },
                ]}
                onChange={(selectedEligibility: Eligibility[]) => {
                  eligibility.onChange(selectedEligibility[0]);
                }}
              />
            </Box>
          )}

          {eligibility.value === Eligibility.CustomerSegments && (
            <>
              <div className={styles.SelectedItemsActivator}>
                {customerSegmentSelector}
              </div>
              <SelectedCustomerSegmentsList
                selectedCustomerSegments={selectedCustomerSegments}
              />
            </>
          )}

          {eligibility.value === Eligibility.Customers && (
            <>
              <div className={styles.SelectedItemsActivator}>
                {customerSelector}
              </div>
              <SelectedCustomersList selectedCustomers={selectedCustomers} />
            </>
          )}
        </BlockStack>
      </Card>
    </Box>
  );
}

export const SelectedCustomersList = ({
  selectedCustomers,
}: {
  selectedCustomers: Field<Customer[]>;
}) => {
  const renderCustomerItem = ({email, displayName}: Customer) => (
    <div className={styles.CustomerItem}>
      <span>{displayName}</span>
      {email && (
        <span className={styles.Email} title={email}>
          {email}
        </span>
      )}
    </div>
  );

  const handleRemoveCustomer = (customerId: string) => {
    selectedCustomers.onChange(
      selectedCustomers.value.filter(
        (customer: Customer) => customer.id !== customerId,
      ),
    );
  };

  return (
    <SelectedItemsList
      items={selectedCustomers.value}
      renderItem={renderCustomerItem}
      onRemoveItem={handleRemoveCustomer}
    />
  );
};

export const SelectedCustomerSegmentsList = ({
  selectedCustomerSegments,
}: {
  selectedCustomerSegments: Field<CustomerSegment[]>;
}) => {
  const renderCustomerSegmentItem = ({name, id}: CustomerSegment) => (
    <Link target="_blank" url={`/customers?segment_id=${parseGid(id)}`}>
      {name}
    </Link>
  );

  const handleRemoveCustomerSegment = (customerSegmentId: string) => {
    selectedCustomerSegments.onChange(
      selectedCustomerSegments.value.filter(
        (segment: CustomerSegment) => segment.id !== customerSegmentId,
      ),
    );
  };

  return (
    <SelectedItemsList
      items={selectedCustomerSegments.value}
      renderItem={renderCustomerSegmentItem}
      onRemoveItem={handleRemoveCustomerSegment}
    />
  );
}; 