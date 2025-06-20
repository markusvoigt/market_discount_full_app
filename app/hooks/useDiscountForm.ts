import { useSubmit } from "@remix-run/react";
import { useCallback, useState } from "react";
import {
  Customer,
  CustomerSegment,
  DiscountMethod,
} from "../types/types";
import {
  type DiscountFormState,
  type MarketConfig,
  Eligibility,
} from "../types/form.types";

interface UseDiscountFormProps {
  initialData?: Partial<DiscountFormState> & {
    customerSelection?: {
      all: boolean;
      customers: Customer[];
      customerSegments: CustomerSegment[];
    };
  };
}

const defaultFormState: DiscountFormState = {
  title: "",
  method: DiscountMethod.Automatic,
  code: "",
  combinesWith: {
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false,
  },
  usageLimit: "",
  appliesOncePerCustomer: false,
  startDate: new Date(),
  endDate: null,
  configuration: {
    collectionIds: [],
    markets: [],
  },
  discountClasses: [],
  discountType: "products_order",
  eligibility: Eligibility.Everyone,
  selectedCustomers: [],
  selectedCustomerSegments: [],
};

export function useDiscountForm({
  initialData = defaultFormState,
}: UseDiscountFormProps) {
  const [formState, setFormState] = useState<DiscountFormState>(() => {
    const state = { ...defaultFormState, ...initialData };

    if (initialData.customerSelection) {
      if (initialData.customerSelection.all) {
        state.eligibility = Eligibility.Everyone;
      } else if (
        initialData.customerSelection.customers &&
        initialData.customerSelection.customers.length > 0
      ) {
        state.eligibility = Eligibility.Customers;
        state.selectedCustomers = initialData.customerSelection.customers;
      } else if (
        initialData.customerSelection.customerSegments &&
        initialData.customerSelection.customerSegments.length > 0
      ) {
        state.eligibility = Eligibility.CustomerSegments;
        state.selectedCustomerSegments =
          initialData.customerSelection.customerSegments;
      }
    }
    return state as DiscountFormState;
  });
  const remixSubmit = useSubmit();

  const setField = useCallback(
    <T extends keyof DiscountFormState>(
      field: T,
      value: DiscountFormState[T],
    ) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setConfigField = useCallback(
    (field: keyof DiscountFormState["configuration"], value: any) => {
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
            m.marketId === marketId ? { ...m, [field]: value } : m,
          ),
        },
      }));
    },
    [],
  );

  const setCombinesWith = useCallback(
    (field: keyof DiscountFormState["combinesWith"], value: boolean) => {
      setFormState((prev) => ({
        ...prev,
        combinesWith: { ...prev.combinesWith, [field]: value },
      }));
    },
    [],
  );

  const submit = useCallback(() => {
    document.getElementById("discount-form")?.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true }),
    );
  }, []);

  return {
    formState,
    setField,
    setConfigField,
    setMarketConfigField,
    setCombinesWith,
    submit,
  };
}
