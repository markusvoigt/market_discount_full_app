import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Button,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  DataTable,
  Badge,
  Banner,
  ButtonGroup,
} from "@shopify/polaris";

import { getFunctions } from "../models/functions.server";
import { getDiscounts, deleteDiscount } from "../models/discounts.server";

type DiscountNode = {
  id: string;
  discount: {
    __typename: 'DiscountAutomaticApp' | 'DiscountCodeApp';
    title: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    codes?: {
      nodes: Array<{
        code: string;
      }>;
    };
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const isCodeDiscount = formData.get("isCodeDiscount") === "true";

  try {
    await deleteDiscount(request, id, isCodeDiscount);
    return json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return json({ success: false, error: errorMessage });
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [functions, discounts] = await Promise.all([
    getFunctions(request),
    getDiscounts(request),
  ]);
  return { functions, discounts };
};

export default function Index() {
  const { functions, discounts } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleDelete = (id: string, isCodeDiscount: boolean) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("isCodeDiscount", isCodeDiscount.toString());
      submit(formData, { method: "post" });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { tone: 'success' | 'warning' | 'critical' | 'info', label: string }> = {
      ACTIVE: { tone: 'success', label: 'Active' },
      SCHEDULED: { tone: 'info', label: 'Scheduled' },
      EXPIRED: { tone: 'critical', label: 'Expired' },
      DEACTIVATED: { tone: 'warning', label: 'Deactivated' },
    };
    const statusInfo = statusMap[status] || { tone: 'info', label: status };
    return <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>;
  };

  const discountRows = (discounts as DiscountNode[]).map(discount => [
    <Text as="span" variant="bodyMd" fontWeight="bold">
      {discount.discount.title}
    </Text>,
    discount.discount.__typename === 'DiscountCodeApp' ? 
      discount.discount.codes?.nodes[0]?.code || '-' : 
      'Automatic',
    getStatusBadge(discount.discount.status),
    formatDate(discount.discount.startsAt),
    discount.discount.endsAt ? formatDate(discount.discount.endsAt) : 'No end date',
    <ButtonGroup>
      <Button
        variant="primary"
        url={`/app/discount/${functions[0]?.id}/${discount.id.split('/').pop()}`}
      >
        Edit
      </Button>
      <Button
        tone="critical"
        onClick={() => handleDelete(
          discount.id,
          discount.discount.__typename === 'DiscountCodeApp'
        )}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page title="Market-Aware Discounts">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Create Market-Specific Discounts
                </Text>
                <Text as="p" variant="bodyMd">
                  This app allows you to create sophisticated discounts that are tailored to specific markets. Key features include:
                </Text>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                  <li>Market-specific discount amounts in local currencies</li>
                  <li>Ability to exclude items on sale from discounts</li>
                  <li>Support for both automatic and code-based discounts</li>
                  <li>Flexible date ranges for each market configuration</li>
                </ul>
                <Box paddingBlockStart="400">
                  <InlineStack gap="300">
                    {functions.map((item: { id: string, title: string }) => (
                      <Button
                        key={item.id}
                        variant="primary"
                        url={`/app/discount/${item.id}/new`}
                      >
                        Create {item.title}
                      </Button>
                    ))}
                  </InlineStack>
                </Box>
              </BlockStack>
            </Card>

            {discounts.length > 0 ? (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Current Discounts
                  </Text>
                  <DataTable
                    columnContentTypes={[
                      'text',
                      'text',
                      'text',
                      'text',
                      'text',
                      'text',
                    ]}
                    headings={[
                      'Title',
                      'Code',
                      'Status',
                      'Start Date',
                      'End Date',
                      'Actions',
                    ]}
                    rows={discountRows}
                  />
                </BlockStack>
              </Card>
            ) : (
              <Banner
                title="No discounts found"
                tone="info"
              >
                <p>Create your first discount to get started.</p>
              </Banner>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
