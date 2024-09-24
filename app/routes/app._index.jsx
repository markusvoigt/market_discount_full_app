import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, Link  } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  IndexTable,
  Badge,
 Button
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
      {
  discountNodes(first:100,query:"type:app",sortKey:CREATED_AT, reverse:true){
    edges{
      node{
        discount{
          ... on DiscountCodeApp{
            discountId
            discountClass
            status
            appDiscountType{
              functionId
              app{
                handle
              }
            }
            codes(first:10){
              edges{
                node{
                  id
                  code
                  asyncUsageCount
                }
              }
            }
          }
        }
      }
    }
  }
}`);
  const discountData = await response.json();
  return discountData;
};


export default function Index() {

  const discounts = useLoaderData().data.discountNodes.edges.filter((node)=>node.node.discount.codes!=undefined && node.node.discount.appDiscountType?.app.handle=="local-discount-code") || [];


  const rowMarkup = discounts.map(
    (discount, index) => (
      <IndexTable.Row
        id={discount.node.discount.codes.edges.find(Boolean)?.node.id}
        key={discount.node.discount.codes.edges.find(Boolean)?.node.id}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {discount.node.discount.codes.edges.find(Boolean)?.node.code}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell><Text as="span" numeric>{discount.node.discount.discountClass}</Text></IndexTable.Cell>
        <IndexTable.Cell>{discount.node.discount.codes.edges.find(Boolean)?.node.asyncUsageCount}</IndexTable.Cell>
        <IndexTable.Cell>
        <Badge tone={discount.node.discount.status == "ACTIVE" ? "success" : "complete"}> {discount.node.discount.status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
        <Link to={`/app/local-discount/${discount.node.discount.appDiscountType.functionId}/${discount.node.discount.discountId.split(`/`).slice(-1)[0]}`}>Edit</Link>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );



  return (
    <Page>
      <TitleBar title="Better discount codes">
      <Link to="/app/local-discount/6134121a-2a46-4f5f-b6b2-eea1ab8d4d00/new">New discount code</Link>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="000">
                  <Text as="h2" variant="headingMd">
                    Better discount codes
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This app allows to create discount codes per market and limited to products that are not on sale, based on the compare_at price of a product.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Current active discounts
                  </Text>
                  <IndexTable
        itemCount={discounts.length}
        selectable={false}
        headings={[
          {title: 'Code'},
          {title: 'Type'},
          {title: 'Used'},
          {title: 'Status'},
          {title: 'Edit'}
        ]}
      >
        {rowMarkup}
      </IndexTable>
                </BlockStack>
                </BlockStack>
            </Card>
          </Layout.Section>
       
        </Layout>
      </BlockStack>
    </Page>
  );
}
