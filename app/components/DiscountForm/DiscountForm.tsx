import { Form } from "@remix-run/react";
import {
  Banner,
  Card,
  Text,
  Layout,
  PageActions,
  TextField,
  BlockStack,
  Box,
  Checkbox,
  Select,
  InlineStack,
  DataTable,
} from "@shopify/polaris";
import { returnToDiscounts } from "app/utils/navigation";
import { useCallback, useMemo, useState, useEffect } from "react";

import { useDiscountForm } from "../../hooks/useDiscountForm";
import { DiscountClass } from "../../types/admin.types.d";
import { DiscountMethod } from "../../types/types";
import { CollectionPicker } from "../CollectionPicker/CollectionPicker";
import { DatePickerField } from "../DatePickerField/DatePickerField";
import { MarketConfig, DiscountType } from "../../types/form.types";
import { GET_MARKETS } from "../../graphql/discounts";

interface SubmitError {
  message: string;
  field: string[];
}

interface DiscountFormProps {
  initialData?: {
    title: string;
    method: DiscountMethod;
    code: string;
    combinesWith: {
      orderDiscounts: boolean;
      productDiscounts: boolean;
      shippingDiscounts: boolean;
    };
    discountClasses: DiscountClass[];
    usageLimit: number | null;
    appliesOncePerCustomer: boolean;
    startsAt: string | Date;
    endsAt: string | Date | null;
    configuration: {
      metafieldId?: string;
      collectionIds?: string[];
      markets?: MarketConfig[];
    };
  };
  collections: { id: string; title: string }[];
  isEditing?: boolean;
  submitErrors?: SubmitError[];
  isLoading?: boolean;
  success?: boolean;
}

const methodOptions = [
  { label: "Discount code", value: DiscountMethod.Code },
  { label: "Automatic discount", value: DiscountMethod.Automatic },
];

export function DiscountForm({
  initialData,
  collections: initialCollections,
  isEditing = false,
  submitErrors = [],
  isLoading = false,
  success = false,
}: DiscountFormProps) {
  // Patch initialData.configuration to always include all fields
  const patchedInitialData = initialData
    ? {
        ...initialData,
        usageLimit: initialData.usageLimit?.toString() ?? "",
        configuration: {
          metafieldId: initialData.configuration.metafieldId,
          collectionIds: initialData.configuration.collectionIds ?? [],
          markets: initialData.configuration.markets ?? [],
        },
      }
    : undefined;

  const { formState, setField, setConfigField, setMarketConfigField, setCombinesWith, submit } =
    useDiscountForm({
      initialData: patchedInitialData,
    });

  const [collections, setCollections] =
    useState<DiscountFormProps["collections"]>(initialCollections);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const validateEndDate = useCallback(
    (endDate: Date) => {
      if (!formState.startDate) return undefined;
      const startDate = new Date(formState.startDate);
      return endDate < startDate
        ? "End date must be after start date"
        : undefined;
    },
    [formState.startDate],
  );

  const handleEndDateChange = useCallback(
    (date: Date) => {
      const error = validateEndDate(date);
      if (!error) {
        setField("endDate", date);
      }
    },
    [validateEndDate, setField],
  );

  const errorBanner = useMemo(
    () =>
      submitErrors.length > 0 ? (
        <Layout.Section>
          <Banner tone="critical">
            <p>There were some issues with your form submission:</p>
            <ul>
              {submitErrors.map(({ message, field }, index) => (
                <li key={index}>
                  {field.join(".")} {message}
                </li>
              ))}
            </ul>
          </Banner>
        </Layout.Section>
      ) : null,
    [submitErrors],
  );

  const successBanner = useMemo(
    () =>
      success ? (
        <Layout.Section>
          <Banner tone="success">
            <p>Discount saved successfully</p>
          </Banner>
        </Layout.Section>
      ) : null,
    [success],
  );

  const handleCollectionSelect = useCallback(
    async (selectedCollections: { id: string; title: string }[]) => {
      setConfigField(
        "collectionIds",
        selectedCollections.map((collection) => collection.id),
      );
      setCollections(selectedCollections);
    },
    [setConfigField],
  );

  const handleEndDateCheckboxChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setField("endDate", null);
      } else if (!formState.endDate) {
        const tomorrow = new Date(formState.startDate || today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setField("endDate", tomorrow);
      }
    },
    [formState.startDate, formState.endDate, today, setField],
  );

  // Add type selectors for each discount class
  const [productDiscountType, setProductDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [orderDiscountType, setOrderDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [shippingDiscountType, setShippingDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const handleProductDiscountTypeChange = (value: string) => setProductDiscountType(value as 'percentage' | 'fixed');
  const handleOrderDiscountTypeChange = (value: string) => setOrderDiscountType(value as 'percentage' | 'fixed');
  const handleShippingDiscountTypeChange = (value: string) => setShippingDiscountType(value as 'percentage' | 'fixed');

  // Market-aware discount UI
  const [availableMarkets, setAvailableMarkets] = useState<MarketConfig[]>([]);
  const [marketsLoaded, setMarketsLoaded] = useState(false);

  // Helper to clean market config before saving
  const cleanMarketConfig = (market: MarketConfig) => {
    const cleaned = { ...market };
    // Clean cart line discounts
    if (cleaned.cartLineType === 'fixed') {
      cleaned.cartLinePercentage = '0';
    } else {
      cleaned.cartLineFixed = '0';
    }
    // Clean order discounts
    if (cleaned.orderType === 'fixed') {
      cleaned.orderPercentage = '0';
    } else {
      cleaned.orderFixed = '0';
    }
    // Clean delivery discounts
    if (cleaned.deliveryType === 'fixed') {
      cleaned.deliveryPercentage = '0';
    } else {
      cleaned.deliveryFixed = '0';
    }
    return cleaned;
  };

  useEffect(() => {
    if (!marketsLoaded) {
      fetch("/api/markets")
        .then((res) => res.json())
        .then((data) => {
          const loadedMarkets = data.markets.map((m: any) => ({
            marketId: m.id,
            marketName: m.name,
            currencyCode: m.currencySettings.baseCurrency.currencyCode,
            cartLineType: "percentage" as const,
            cartLinePercentage: "0",
            cartLineFixed: "0",
            orderType: "percentage" as const,
            orderPercentage: "0",
            orderFixed: "0",
            deliveryType: "percentage" as const,
            deliveryPercentage: "0",
            deliveryFixed: "0",
            active: true,
            startDate: formState.startDate ? new Date(formState.startDate).toISOString().split('T')[0] : undefined,
            endDate: formState.endDate ? new Date(formState.endDate).toISOString().split('T')[0] : null,
          }));
          setAvailableMarkets(loadedMarkets);
          setMarketsLoaded(true);
          
          // Initialize markets in form state if none exist
          if (!formState.configuration.markets || formState.configuration.markets.length === 0) {
            setConfigField("markets", loadedMarkets);
          }
        });
    }
  }, [marketsLoaded, formState.configuration.markets, formState.startDate, formState.endDate, setConfigField]);

  // Override setMarketConfigField to clean values
  const handleMarketConfigChange = (marketId: string, field: keyof MarketConfig, value: any) => {
    const market = formState.configuration.markets?.find(m => m.marketId === marketId);
    if (market) {
      const updatedMarket = cleanMarketConfig({ ...market, [field]: value });
      Object.keys(updatedMarket).forEach(key => {
        if (market[key as keyof MarketConfig] !== updatedMarket[key as keyof MarketConfig]) {
          setMarketConfigField(marketId, key as keyof MarketConfig, updatedMarket[key as keyof MarketConfig]);
        }
      });
    }
  };

  // Add a helper to get currency symbol
  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", CAD: "$", AUD: "$", JPY: "¥"
    };
    return symbols[code] || code;
  };

  return (
    <Layout>
      {errorBanner}
      {successBanner}
      <Layout.Section>
        <Form method="post" id="discount-form">
          <input
            type="hidden"
            name="discount"
            value={JSON.stringify({
              title: formState.title,
              method: formState.method,
              code: formState.code,
              combinesWith: formState.combinesWith,
              discountClasses: deriveDiscountClassesFromMarkets(formState.configuration.markets, formState.discountType),
              usageLimit:
                formState.usageLimit === ""
                  ? null
                  : parseInt(formState.usageLimit, 10),
              appliesOncePerCustomer: formState.appliesOncePerCustomer,
              startsAt: formState.startDate,
              endsAt: formState.endDate,
              configuration: {
                ...(formState.configuration.metafieldId
                  ? { metafieldId: formState.configuration.metafieldId }
                  : {}),
                collectionIds: formState.configuration.collectionIds || [],
                markets: formState.configuration.markets || [],
              },
            })}
          />
          <BlockStack gap="400">
            {/* Method section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    {isEditing ? "Edit discount" : "Create discount"}
                  </Text>

                  <Select
                    label="Discount type"
                    options={methodOptions}
                    value={formState.method}
                    onChange={(value: DiscountMethod) =>
                      setField("method", value)
                    }
                    disabled={isEditing}
                  />

                  {formState.method === DiscountMethod.Automatic ? (
                    <TextField
                      label="Discount title"
                      autoComplete="off"
                      value={formState.title}
                      onChange={(value) => setField("title", value)}
                    />
                  ) : (
                    <TextField
                      label="Discount code"
                      autoComplete="off"
                      value={formState.code}
                      onChange={(value) => setField("code", value)}
                      helpText="Customers will enter this discount code at checkout."
                    />
                  )}

                  <Select
                    label="What does this discount apply to?"
                    options={[
                      { label: "Products and/or Order Total", value: "products_order" },
                      { label: "Shipping", value: "shipping" }
                    ]}
                    value={formState.discountType || "products_order"}
                    onChange={(value) => {
                      setField("discountType", value as DiscountType);
                      // Update discount classes based on type
                      if (value === "products_order") {
                        setField("discountClasses", [DiscountClass.Product, DiscountClass.Order]);
                      } else {
                        setField("discountClasses", [DiscountClass.Shipping]);
                      }
                    }}
                    helpText="Choose whether this discount reduces product prices/order total or shipping costs. This cannot be changed after creation."
                    disabled={isEditing}
                  />
                </BlockStack>
              </Box>
            </Card>

            {/* Discount Combinations section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Discount Combinations
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Select which types of other discounts this discount can be combined with.
                  </Text>
                  {formState.discountType === "products_order" ? (
                    <>
                      <Checkbox
                        label="Other product discounts"
                        checked={formState.combinesWith.productDiscounts}
                        onChange={(checked) => setCombinesWith("productDiscounts", checked)}
                      />
                      <Checkbox
                        label="Other order discounts"
                        checked={formState.combinesWith.orderDiscounts}
                        onChange={(checked) => setCombinesWith("orderDiscounts", checked)}
                      />
                      <Checkbox
                        label="Shipping discounts"
                        checked={formState.combinesWith.shippingDiscounts}
                        onChange={(checked) => setCombinesWith("shippingDiscounts", checked)}
                      />
                    </>
                  ) : (
                    <>
                      <Checkbox
                        label="Product discounts"
                        checked={formState.combinesWith.productDiscounts}
                        onChange={(checked) => setCombinesWith("productDiscounts", checked)}
                      />
                      <Checkbox
                        label="Order discounts"
                        checked={formState.combinesWith.orderDiscounts}
                        onChange={(checked) => setCombinesWith("orderDiscounts", checked)}
                      />
                    </>
                  )}
                </BlockStack>
              </Box>
            </Card>

            {/* Market Configuration section */}
            <Card>
              <Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Market-specific configuration
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Configure discount values per market. All values are in the presentment currency for each market.
                  </Text>
                  {(formState.configuration.markets || []).length > 0 && (
                    <DataTable
                      columnContentTypes={[
                        'text', 'text', 'text', 'text', 'text',
                        ...(formState.discountType === "products_order" ? ['text', 'text'] : []),
                        ...(formState.discountType === "shipping" ? ['text'] : [])
                      ]}
                      headings={[
                        "Market",
                        "Active",
                        "Start",
                        "End",
                        "Exclude On Sale",
                        ...(formState.discountType === "products_order" ? ["Product Discount", "Order Discount"] : []),
                        ...(formState.discountType === "shipping" ? ["Shipping Discount"] : [])
                      ]}
                      rows={(formState.configuration.markets || []).map((market, idx) => {
                        const currency = `${getCurrencySymbol(market.currencyCode)} (${market.currencyCode})`;
                        const isPrimary = idx === 0;
                        const disabled = !market.active;
                        const baseColumns = [
                          <div style={{ fontWeight: isPrimary ? 600 : 400, background: isPrimary ? '#f4f6f8' : undefined, padding: '4px 8px', borderRadius: 4 }}>{market.marketName} {currency} {isPrimary && <span style={{ color: '#007b5c', fontWeight: 700 }}>(Primary)</span>}</div>,
                          <Checkbox
                            label="Active"
                            checked={!!market.active}
                            onChange={(checked) => handleMarketConfigChange(market.marketId, "active", checked)}
                          />,
                          <TextField
                            label="Start date"
                            type="date"
                            value={market.startDate || ""}
                            onChange={(value) => handleMarketConfigChange(market.marketId, "startDate", value)}
                            autoComplete="off"
                            disabled={disabled}
                          />,
                          <TextField
                            label="End date"
                            type="date"
                            value={market.endDate || ""}
                            onChange={(value) => handleMarketConfigChange(market.marketId, "endDate", value)}
                            autoComplete="off"
                            disabled={disabled}
                          />,
                          <Checkbox
                            label="Exclude on sale"
                            checked={!!market.excludeOnSale}
                            onChange={(checked) => handleMarketConfigChange(market.marketId, "excludeOnSale", checked)}
                            disabled={disabled}
                          />
                        ];

                        if (formState.discountType === "products_order") {
                          return [
                            ...baseColumns,
                            <InlineStack gap="100">
                              <Select
                                label="Product discount type"
                                options={[
                                  { label: "%", value: "percentage" },
                                  { label: getCurrencySymbol(market.currencyCode), value: "fixed" },
                                ]}
                                value={market.cartLineType}
                                onChange={(value) => handleMarketConfigChange(market.marketId, "cartLineType", value)}
                                disabled={disabled}
                              />
                              {market.cartLineType === "percentage" ? (
                                <TextField
                                  label="Product discount percentage"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={market.cartLinePercentage}
                                  onChange={(value) => handleMarketConfigChange(market.marketId, "cartLinePercentage", value)}
                                  suffix="%"
                                  autoComplete="off"
                                  disabled={disabled}
                                />
                              ) : (
                                <TextField
                                  label="Product discount fixed value"
                                  type="number"
                                  min="0"
                                  value={market.cartLineFixed}
                                  onChange={(value) => handleMarketConfigChange(market.marketId, "cartLineFixed", value)}
                                  suffix={getCurrencySymbol(market.currencyCode)}
                                  autoComplete="off"
                                  disabled={disabled}
                                />
                              )}
                            </InlineStack>,
                            <InlineStack gap="100">
                              <Select
                                label="Order discount type"
                                options={[
                                  { label: "%", value: "percentage" },
                                  { label: getCurrencySymbol(market.currencyCode), value: "fixed" },
                                ]}
                                value={market.orderType}
                                onChange={(value) => handleMarketConfigChange(market.marketId, "orderType", value)}
                                disabled={disabled}
                              />
                              {market.orderType === "percentage" ? (
                                <TextField
                                  label="Order discount percentage"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={market.orderPercentage}
                                  onChange={(value) => handleMarketConfigChange(market.marketId, "orderPercentage", value)}
                                  suffix="%"
                                  autoComplete="off"
                                  disabled={disabled}
                                />
                              ) : (
                                <TextField
                                  label="Order discount fixed value"
                                  type="number"
                                  min="0"
                                  value={market.orderFixed}
                                  onChange={(value) => handleMarketConfigChange(market.marketId, "orderFixed", value)}
                                  suffix={getCurrencySymbol(market.currencyCode)}
                                  autoComplete="off"
                                  disabled={disabled}
                                />
                              )}
                            </InlineStack>
                          ];
                        } else {
                          return [
                            ...baseColumns,
                            <InlineStack gap="100">
                              <Select
                                label="Shipping discount type"
                                options={[
                                  { label: "%", value: "percentage" },
                                  { label: getCurrencySymbol(market.currencyCode), value: "fixed" },
                                ]}
                                value={market.deliveryType}
                                onChange={(value) => handleMarketConfigChange(market.marketId, "deliveryType", value)}
                                disabled={disabled}
                              />
                              {market.deliveryType === "percentage" ? (
                                <TextField
                                  label="Shipping discount percentage"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={market.deliveryPercentage}
                                  onChange={(value) => handleMarketConfigChange(market.marketId, "deliveryPercentage", value)}
                                  suffix="%"
                                  autoComplete="off"
                                  disabled={disabled}
                                />
                              ) : (
                                <TextField
                                  label="Shipping discount fixed value"
                                  type="number"
                                  min="0"
                                  value={market.deliveryFixed}
                                  onChange={(value) => handleMarketConfigChange(market.marketId, "deliveryFixed", value)}
                                  suffix={getCurrencySymbol(market.currencyCode)}
                                  autoComplete="off"
                                  disabled={disabled}
                                />
                              )}
                            </InlineStack>
                          ];
                        }
                      })}
                    />
                  )}
                  {(formState.configuration.markets || []).length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                      <div>
                        <b>Note:</b> Fixed value discounts are applied in the presentment currency for each market (shown above as code and symbol).
                      </div>
                      {formState.discountType === "products_order" && (
                        <div>
                          <b>How are items on sale identified?</b> Items are considered "on sale" if their <code>compare_at_price</code> is greater than their <code>price</code> in the market's currency.
                        </div>
                      )}
                    </div>
                  )}
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Save discount",
                loading: isLoading,
                onAction: submit,
              }}
              secondaryActions={[
                {
                  content: "Discard",
                  onAction: returnToDiscounts,
                },
              ]}
            />
          </Layout.Section>
        </Form>
      </Layout.Section>
    </Layout>
  );
}

function deriveDiscountClassesFromMarkets(markets: MarketConfig[] = [], discountType: DiscountType = "products_order"): string[] {
  const DiscountClass = {
    Product: "PRODUCT",
    Order: "ORDER",
    Shipping: "SHIPPING",
  };

  // If it's a shipping discount, always return SHIPPING class
  if (discountType === "shipping") {
    return [DiscountClass.Shipping];
  }

  // For product/order discounts, check if any market has active values
  const classes = new Set<string>();
  for (const market of markets) {
    if (!market.active) continue;
    if (
      (market.cartLineType === "percentage" && Number(market.cartLinePercentage) > 0) ||
      (market.cartLineType === "fixed" && Number(market.cartLineFixed) > 0)
    ) {
      classes.add(DiscountClass.Product);
    }
    if (
      (market.orderType === "percentage" && Number(market.orderPercentage) > 0) ||
      (market.orderType === "fixed" && Number(market.orderFixed) > 0)
    ) {
      classes.add(DiscountClass.Order);
    }
  }

  // If no classes were derived but it's a products_order discount, 
  // default to both Product and Order classes
  if (classes.size === 0 && discountType === "products_order") {
    return [DiscountClass.Product, DiscountClass.Order];
  }

  return Array.from(classes);
}
