import { useEffect, useMemo, useState } from "react";
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

export const loader = async ({ request }) => {
  const { admin } = await shopify.authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    {
       markets(first:50){
    edges{
      node{
        id,
        handle,
        name
      }
    }
  }    }`);
  const marketData = await response.json();

  return marketData;
};

export const action = async ({ params, request }) => {
  const { functionId } = params;
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
      type: "json",
      value: JSON.stringify({
        selectedMarkets: configuration.availableInMarkets,
        oncePerOrder: configuration.oncePerOrder,
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
          mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
            discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
              codeAppDiscount{
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
            ...baseCodeDiscount,
            metafields,
          },
        },
      },
    );

    const responseJson = await response.json();

    const errors = responseJson.data.discountCreate?.userErrors;
    const discount = responseJson.data.discountCreate?.codeAppDiscount;
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
    const errors = responseJson.data.discountCreate?.userErrors;
    return json({ errors });
  }
};

export default function VolumeNew() {
  const submitForm = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const todaysDate = useMemo(() => new Date(), []);

  const isLoading = navigation.state === "submitting";
  const currencyCode = CurrencyCode.Eur;
  const submitErrors = actionData?.errors || [];
  const returnToDiscounts = () => open("shopify://admin/discounts", "_top");

  const markets = useLoaderData().data.markets.edges?.map((node)=>{return node.node}) || [];

  const [selectedMarkets, setSelectedMarkets] = useState(markets)

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
      discountTitle: useField(""),
      discountMethod: useField(DiscountMethod.Code),
      discountCode: useField(""),
      combinesWith: useField({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      usageLimit: useField(null),
      appliesOncePerCustomer: useField(false),
      startDate: useField(todaysDate),
      endDate: useField(null),
      configuration: {
        discountValueType: useField("FixedAmount"),
        oncePerOrder: useField(false),
        fixedAmountDiscountValue: useField("0"),
        percentageDiscountValue: useField("0"),
        excludeItemsOnSale: useField(false),
        availableInMarkets: useField(selectedMarkets.map((market)=>market.handle))
      },
    },
    onSubmit: async (form) => {
      const discount = {
        title: form.discountTitle,
        method: form.discountMethod,
        code: form.discountCode,
        combinesWith: form.combinesWith,
        usageLimit: form.usageLimit == null ? null : parseInt(form.usageLimit),
        appliesOncePerCustomer: form.appliesOncePerCustomer,
        startsAt: form.startDate,
        endsAt: form.endDate,
        configuration: {
          discountValueType: form.configuration.discountValueType,
          oncePerOrder: form.configuration.oncePerOrder,
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
      <ui-title-bar title="Create local discount">
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
        <button variant="primary" onClick={submit}>
          Save discount
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
