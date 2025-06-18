import { useSubmit } from "@remix-run/react";
import { useCallback, useState } from "react";

import { DiscountClass } from "../types/admin.types.d";
import { DiscountMethod } from "../types/types";
import { MarketConfig, DiscountType } from "../types/form.types";

interface Collection {
  id: string;
  title: string;
}

interface CombinesWith {
  orderDiscounts: boolean;
  productDiscounts: boolean;
  shippingDiscounts: boolean;
}

interface DiscountConfiguration {
  metafieldId?: string;
  collectionIds?: string[];
  markets?: MarketConfig[];
}

interface FormState {
  title: string;
  method: DiscountMethod;
  code: string;
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  discountClasses: DiscountClass[];
  discountType: DiscountType;
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  startDate: string | Date;
  endDate: string | Date | null;
  configuration: {
    metafieldId?: string;
    collectionIds?: string[];
    markets?: MarketConfig[];
  };
}

interface UseDiscountFormProps {
  initialData?: Partial<FormState>;
}

const defaultFormState: FormState = {
  title: "",
  method: DiscountMethod.Code,
  code: "",
  combinesWith: {
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false,
  },
  discountClasses: [],
  discountType: "products_order",
  usageLimit: "",
  appliesOncePerCustomer: false,
  startDate: new Date(),
  endDate: null,
  configuration: {
    markets: [],
  },
};

export function useDiscountForm({ initialData }: UseDiscountFormProps = {}) {
  const submit = useSubmit();
  const todaysDate = new Date();

  const [formState, setFormState] = useState<FormState>(() => {
    const discountType = initialData?.discountType ?? defaultFormState.discountType;
    const discountClasses = discountType === "shipping"
      ? [DiscountClass.Shipping]
      : [DiscountClass.Product, DiscountClass.Order];

    return {
      ...defaultFormState,
      ...initialData,
      // Ensure type safety for nullable fields
      usageLimit: initialData?.usageLimit?.toString() ?? defaultFormState.usageLimit,
      startDate: initialData?.startDate ?? defaultFormState.startDate,
      endDate: initialData?.endDate ?? defaultFormState.endDate,
      discountClasses,
      configuration: {
        metafieldId: initialData?.configuration?.metafieldId,
        markets: initialData?.configuration?.markets ?? defaultFormState.configuration.markets,
      },
    };
  });

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => {
        const updates = { [field]: value } as Pick<FormState, K>;
        
        // If changing discount type, update discount classes
        if (field === "discountType") {
          const type = value as DiscountType;
          (updates as any).discountClasses = type === "shipping" 
            ? [DiscountClass.Shipping]
            : [DiscountClass.Product, DiscountClass.Order];
        }
        
        return { ...prev, ...updates };
      });
    },
    [],
  );

  const setConfigField = useCallback(
    (
      field: keyof DiscountConfiguration,
      value: string | string[] | Collection[],
    ) => {
      setFormState((prev) => ({
        ...prev,
        configuration: { ...prev.configuration, [field]: value },
      }));
    },
    [],
  );

  const setMarketConfigField = useCallback(
    (marketId: string, field: keyof MarketConfig, value: any) => {
      setFormState((prev) => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          markets: (prev.configuration.markets || []).map((m) =>
            m.marketId === marketId ? { ...m, [field]: value } : m
          ),
        },
      }));
    },
    [],
  );

  const setCombinesWith = useCallback(
    (field: keyof CombinesWith, value: boolean) => {
      setFormState((prev) => ({
        ...prev,
        combinesWith: { ...prev.combinesWith, [field]: value },
      }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    const now = new Date().toISOString().slice(0, 10);
    formData.append(
      "discount",
      JSON.stringify({
        title: formState.title,
        method: formState.method,
        code: formState.code,
        combinesWith: formState.combinesWith,
        discountClasses: formState.discountClasses,
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
          collectionIds: formState.configuration.collectionIds,
          markets: (formState.configuration.markets || []).map((market) => ({
            ...market,
            startDate: market.startDate || now,
            endDate: market.endDate || null,
          })),
        },
      }),
    );
    submit(formData, { method: "post" });
  }, [formState, submit]);

  return {
    formState,
    setField,
    setConfigField,
    setMarketConfigField,
    setCombinesWith,
    submit: handleSubmit,
  };
}
