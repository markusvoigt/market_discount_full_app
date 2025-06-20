import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Layout, Text, Box } from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.admin(request);
  const { accessToken } = session;

  return json({ accessToken });
};

export default function TokenPage() {
  const { accessToken } = useLoaderData<typeof loader>();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              Offline Access Token
            </Text>
            <Box paddingBlockStart="200">
              <Text tone="critical" as="p">
                Warning: Keep this token secret and secure. Anyone with this token can access your Shopify admin data.
              </Text>
            </Box>
            <Box paddingBlockStart="200">
              <Text as="p">
                This access token can be used to manage the discounts created through this app, which is a feature often requested by Enterprise clients. Use it with any Shopify API client to see and manage your discounts.
              </Text>
            </Box>
            <Box paddingBlockStart="200">
              <Text as="p">Your access token is:</Text>
              <pre>
                <code>{accessToken}</code>
              </pre>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 