import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useForm, useField, asChoiceField } from "@shopify/react-form";
 import { CurrencyCode } from "@shopify/react-i18n";

import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
  useLoaderData
} from "@remix-run/react";
import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  MethodCard,
  DiscountStatus,
  RequirementType,
  SummaryCard,
  UsageLimitsCard,
  ValueCard,
} from "@shopify/discount-app-components";
import {
  Banner,
  Card,
  Text,
  Layout,
  Page,
  PageActions,
  Divider,
  BlockStack,
  Box,
  Checkbox,
} from "@shopify/polaris";

import shopify from "../shopify.server";
import { PurchaseType } from "@shopify/discount-app-components/build/cjs/constants";

export const loader = async ({ request, params}) => {
  const { admin } = await shopify.authenticate.admin(request);
  const discountId="gid://shopify/DiscountNode/"+params.id;
  const response = await admin.graphql(
    `#graphql
    query GetMarketsAndDiscount($discountId : ID!){
       markets(first:50){
    edges{
      node{
        id,
        handle,
        name
      }
    }
  },
  discountNode(id:$discountId){
    id,
    discount{
      ... on DiscountCodeApp{
        combinesWith{
          productDiscounts,
          shippingDiscounts,
          orderDiscounts
        }
        usageLimit
        appliesOncePerCustomer
        startsAt
        endsAt
        codes(first:10){
          edges{
            node{
              id
              code

            }
          }
        }
      }
    }
    metafield(key:"function-configuration",namespace:"$app:super-discount"){
      key,
      jsonValue
    }
  }}
      `,{
        variables:{
        discountId,
      }
    }
      );
  const data = await response.json();
  return data;
};

export const action = async ({ params, request }) => {
  const { functionId } = params;
  const discountId="gid://shopify/DiscountCodeNode/"+params.id;
  const { admin } = await shopify.authenticate.admin(request);
  const formData = await request.formData();
  const {
    title,
    method,
    code,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    configuration,
  } = JSON.parse(formData.get("discount"));

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };
  const metafields = [
    {
      namespace: "$app:super-discount",
      key: "function-configuration",
      ownerId: discountId,
      type: "json",
      value: JSON.stringify({
        oncePerOrder: configuration.oncePerOrder,
        selectedMarkets: configuration.availableInMarkets,
        excludeLineItemsOnSale: configuration.excludeItemsOnSale,
        percentage: configuration.percentageDiscountValue || 0,
        fixed: configuration.fixedAmountDiscountValue || 0,
        type: configuration.discountValueType
      }),
    },
  ];

  if (method === DiscountMethod.Code) {
    const baseCodeDiscount = {
      ...baseDiscount,
      title: code,
      code,
      usageLimit,
      appliesOncePerCustomer,
    };

    const response = await admin.graphql(
      `#graphql
          mutation UpdateCodeDiscount($discount: DiscountCodeAppInput!, $id: ID!, $metafields: [MetafieldsSetInput!]!) {
            discountUpdate: discountCodeAppUpdate(codeAppDiscount: $discount, id: $id) {
              codeAppDiscount{
                discountId
              }
              userErrors {
                code
                message
                field
              }
            }
            metafieldsUpdate: metafieldsSet(metafields: $metafields) {
    metafields {
      id
      namespace
      key
    }
    userErrors {
      field
      message
    }
  }
          }`,
      {
        variables: {
            id: discountId,
            discount: {
            ...baseCodeDiscount,
          },
          metafields
        },
      },
    );

    const responseJson = await response.json();

    const errors = responseJson.data.discountUpdate?.userErrors;
    const discount = responseJson.data.discountUpdate?.codeAppDiscount;
    return json({ errors, discount: { ...discount, functionId } });
  } else {
    const response = await admin.graphql(
      `#graphql
          mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
            discountCreate: discountAutomaticAppCreate(automaticAppDiscount: $discount) {
              automaticAppDiscount {
                discountId
              }
              userErrors {
                code
                message
                field
              }
            }
          }`,
      {
        variables: {
          discount: {
            ...baseDiscount,
            metafields,
          },
        },
      },
    );

    const responseJson = await response.json()
    ;
    const errors = responseJson.data.discountUpdate?.userErrors;
    return json({ errors });
  }
};

export default function VolumeNew() {
  const submitForm = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isLoading = navigation.state === "submitting";
  const currencyCode = CurrencyCode.Eur;
  const submitErrors = actionData?.errors || [];
  const returnToDiscounts = () => open("shopify://admin/discounts", "_top");

  const markets = useLoaderData().data.markets.edges?.map((node)=>{return node.node}) || [];
  const config = useLoaderData().data.discountNode;


  const [selectedMarkets, setSelectedMarkets] = useState(markets.filter((market)=>config.metafield.jsonValue.selectedMarkets.some((m)=> m==market.handle)));

  useEffect(() => {
    if (actionData?.errors.length === 0 && actionData?.discount) {
      returnToDiscounts();
    }
  }, [actionData]);

  const {
    fields: {
      discountTitle,
      discountCode,
      discountMethod,
      combinesWith,
      requirementType,
      requirementSubtotal,
      requirementQuantity,
      usageLimit,
      appliesOncePerCustomer,
      startDate,
      endDate,
      configuration,
    },
    submit,
  } = useForm({
    fields: {
      discountTitle: useField(),
      discountMethod: useField(DiscountMethod.Code),
      discountCode: useField(config.discount.codes.edges[0].node.code),
      combinesWith: useField({
        orderDiscounts: config.discount.combinesWith.orderDiscounts,
        productDiscounts: config.discount.combinesWith.productDiscounts,
        shippingDiscounts: config.discount.combinesWith.shippingDiscounts,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      usageLimit: useField(config.discount.usageLimit),
      appliesOncePerCustomer: useField(config.discount.appliesOncePerCustomer),
      startDate: useField(new Date(config.discount.startsAt)),
      endDate: useField(null),
      configuration: {
        oncePerOrder: useField(config.metafield.jsonValue.oncePerOrder),
        discountValueType: useField(config.metafield.jsonValue.type),
        fixedAmountDiscountValue: useField(config.metafield.jsonValue.fixed),
        percentageDiscountValue: useField(config.metafield.jsonValue.percentage),
        excludeItemsOnSale: useField(config.metafield.jsonValue.excludeLineItemsOnSale),
        availableInMarkets: useField(selectedMarkets.map((market)=>market.handle))
      },
    },
    onSubmit: async (form) => {
      const discount = {
        id: form.discountId,
        title: form.discountTitle,
        method: form.discountMethod,
        code: form.discountCode,
        combinesWith: form.combinesWith,
        usageLimit: form.usageLimit == null ? null : parseInt(form.usageLimit),
        appliesOncePerCustomer: form.appliesOncePerCustomer,
        startsAt: form.startDate,
        endsAt: form.endDate,
        configuration: {
        oncePerOrder: form.configuration.oncePerOrder,
          discountValueType: form.configuration.discountValueType,
          fixedAmountDiscountValue: form.configuration.fixedAmountDiscountValue,
          percentageDiscountValue: form.configuration.percentageDiscountValue,
          excludeItemsOnSale: form.configuration.excludeItemsOnSale,
          availableInMarkets: form.configuration.availableInMarkets,
        },
      };
      submitForm({ discount: JSON.stringify(discount) }, { method: "post" });

      return { status: "success" };
    },
  });

  const errorBanner =
    submitErrors.length > 0 ? (
      <Layout.Section>
        <Banner tone="critical">
          <p>There were some issues with your form submission:</p>
          <ul>
            {submitErrors.map(({ message, field }, index) => {
              return (
                <li key={`${message}${index}`}>
                  {field.join(".")} {message}
                </li>
              );
            })}
          </ul>
        </Banner>
      </Layout.Section>
    ) : null;

  return (
    <Page>
      <ui-title-bar title="Edit discount">
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
        <button variant="primary" onClick={submit}>
          Update discount
        </button>
      </ui-title-bar>
      <Layout>
        {errorBanner}
        <Layout.Section>
          <Form method="post">
            <BlockStack align="space-around" gap="200">
              <MethodCard
                title="Local"
                discountTitle={discountTitle}
                discountClass={DiscountClass.Product}
                discountCode={discountCode}
                discountMethod={discountMethod}
                discountMethodHidden={true}
              />
              <ValueCard
                fixedAmountDiscountValue={configuration.fixedAmountDiscountValue}
                percentageDiscountValue={configuration.percentageDiscountValue}
                discountValueType={configuration.discountValueType}
                purchaseType={PurchaseType.OneTimePurchase}
                oncePerOrder={configuration.oncePerOrder}
                discountClass={DiscountClass.Product}
                currencyCode="EUR"
                sellsSubscriptions={false}
                isCodeDiscount={discountMethod.value===DiscountMethod.Code}/>
              <Box paddingBlockEnd="300">
                <Card>
                  <BlockStack gap="500">
                    <Text variant="headingMd" as="h2">
                      Availability of the discount
                    </Text>
                    <BlockStack>
                    {markets.map((market, index) => (
    <div key={index}>
      <Checkbox
      key={market.id}
      label={market.name}
      checked={selectedMarkets.find((m) => m.id==market.id)}
      onChange={(checked)=>{
        if (!checked) {
          setSelectedMarkets((selectedMarkets) => selectedMarkets.filter(m => m.id !== market.id));
        } else {
          setSelectedMarkets([...selectedMarkets, market]);
        }
      }} 
    />
    </div>
  ))}
                    
  </BlockStack>
      <Divider />
                <Checkbox
            label="Exclude line items in sale (in the market)"
            {... asChoiceField(configuration.excludeItemsOnSale)}
              />
                  </BlockStack>
                </Card>
              </Box>
              {discountMethod.value === DiscountMethod.Code && (
                <UsageLimitsCard
                  totalUsageLimit={usageLimit}
                  oncePerCustomer={appliesOncePerCustomer}
                />
              )}
              <CombinationCard
                combinableDiscountTypes={combinesWith}
                discountClass={DiscountClass.Product}
                discountDescriptor={"Discount"}
              />
              <ActiveDatesCard
                startDate={startDate}
                endDate={endDate}
                timezoneAbbreviation="CEST"
              />
            </BlockStack>
          </Form>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <SummaryCard
            header={{
              discountMethod: discountMethod.value,
              discountDescriptor:
                discountMethod.value === DiscountMethod.Automatic
                  ? discountTitle.value
                  : discountCode.value,
              appDiscountType:"Market",
              isEditing: false,
            }}
            performance={{
              status: DiscountStatus.Scheduled,
              usageCount: 0,
              isEditing: false,
            }}
            minimumRequirements={{
              requirementType: requirementType.value,
              subtotal: requirementSubtotal.value,
              quantity: requirementQuantity.value,
              currencyCode: currencyCode,
            }}
            excludeItemsOnSale
            usageLimits={{
              oncePerCustomer: appliesOncePerCustomer.value,
              totalUsageLimit: usageLimit.value,
            }}
            activeDates={{
              startDate: startDate.value,
              endDate: endDate.value,
            }}
          />
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Save discount",
              onAction: submit,
              loading: isLoading,
            }}
            secondaryActions={[
              {
                content: "Discard",
                onAction: returnToDiscounts,
              },
            ]}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
