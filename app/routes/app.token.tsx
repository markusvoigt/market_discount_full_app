import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Layout, Text, Box, Button, InlineStack } from "@shopify/polaris";
import { useCallback, useState } from "react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.admin(request);
  const { accessToken } = session;

  return json({ accessToken });
};

export default function TokenPage() {
  const { accessToken } = useLoaderData<typeof loader>();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedToken = accessToken
    ? `${"•".repeat(Math.max(0, accessToken.length - 4))}${accessToken.slice(-4)}`
    : "";

  const handleCopy = useCallback(() => {
    if (accessToken) {
      navigator.clipboard.writeText(accessToken).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [accessToken]);

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
                Warning: Keep this token secret and secure. Anyone with this
                token can access your Shopify admin data.
              </Text>
            </Box>
            <Box paddingBlockStart="200">
              <Text as="p">
                This access token can be used to manage the discounts created
                through this app, which is a feature often requested by
                Enterprise clients. Use it with any Shopify API client to see
                and manage your discounts.
              </Text>
            </Box>
            <Box paddingBlockStart="200">
              <Text as="p">Your access token:</Text>
              <Box paddingBlockStart="100">
                <pre
                  style={{
                    background: "#f6f6f7",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  <code>{revealed ? accessToken : maskedToken}</code>
                </pre>
              </Box>
              <Box paddingBlockStart="200">
                <InlineStack gap="200">
                  <Button onClick={() => setRevealed((r) => !r)}>
                    {revealed ? "Hide" : "Reveal"}
                  </Button>
                  <Button onClick={handleCopy} variant="primary">
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </Button>
                </InlineStack>
              </Box>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
