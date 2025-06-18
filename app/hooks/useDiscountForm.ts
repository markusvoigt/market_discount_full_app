import { useSubmit } from "@remix-run/react";
import { useCallback, useState } from "react";

import { DiscountClass } from "../types/admin.types.d";
import { DiscountMethod } from "../types/types";
import { MarketConfig } from "../types/form.types";

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

export interface FormState {
  title: string;
  method: DiscountMethod;
  code: string;
  combinesWith: CombinesWith;
  discountClasses: DiscountClass[];
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  startDate: Date | string;
  endDate: Date | string | null;
  configuration: DiscountConfiguration;
}

interface UseDiscountFormProps {
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
  onSubmit?: () => void;
}

export function useDiscountForm({ initialData }: UseDiscountFormProps = {}) {
  const submit = useSubmit();
  const todaysDate = new Date();

  const [formState, setFormState] = useState<FormState>(() => ({
    title: initialData?.title ?? "",
    method: initialData?.method ?? DiscountMethod.Code,
    code: initialData?.code ?? "",
    discountClasses: initialData?.discountClasses ?? [DiscountClass.Product],
    combinesWith: initialData?.combinesWith ?? {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: initialData?.usageLimit?.toString() ?? "",
    appliesOncePerCustomer: initialData?.appliesOncePerCustomer ?? false,
    startDate: initialData?.startsAt ?? todaysDate,
    endDate: initialData?.endsAt ?? null,
    configuration: {
      metafieldId: initialData?.configuration?.metafieldId,
      markets: initialData?.configuration?.markets ?? [],
    },
  }));

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
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
