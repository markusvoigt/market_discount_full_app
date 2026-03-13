import { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Page } from "@shopify/polaris";

import { DiscountForm } from "../components/DiscountForm/DiscountForm";
import {
  createCodeDiscount,
  createAutomaticDiscount,
} from "../models/discounts.server";
import { DiscountMethod } from "../types/types";
import { returnToDiscounts } from "../utils/navigation";

export const loader = async () => {
  // Initially load with empty collections since none are selected yet
  return { collections: [] };
};

// [START build-the-ui.add-action]
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;
  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string")
    throw new Error("No discount data provided");

  let parsed;
  try {
    parsed = JSON.parse(discountData);
  } catch {
    return { errors: [{ message: "Invalid discount data", field: ["discount"] }] };
  }

  const {
    title,
    method,
    code,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
    customerSelection,
    configuration,
  } = parsed;

  const parsedUsageLimit = usageLimit ? parseInt(String(usageLimit), 10) : null;
  if (parsedUsageLimit !== null && isNaN(parsedUsageLimit)) {
    return { errors: [{ message: "Usage limit must be a valid number", field: ["usageLimit"] }] };
  }

  const parsedStartsAt = new Date(startsAt);
  const parsedEndsAt = endsAt ? new Date(endsAt) : null;

  if (isNaN(parsedStartsAt.getTime())) {
    return { errors: [{ message: "Start date is invalid", field: ["startsAt"] }] };
  }
  if (parsedEndsAt && isNaN(parsedEndsAt.getTime())) {
    return { errors: [{ message: "End date is invalid", field: ["endsAt"] }] };
  }
  if (parsedEndsAt && parsedEndsAt < parsedStartsAt) {
    return { errors: [{ message: "End date must be after start date", field: ["endsAt"] }] };
  }

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    discountClasses,
    startsAt: parsedStartsAt,
    endsAt: parsedEndsAt,
  };

  let result;

  if (method === DiscountMethod.Code) {
    result = await createCodeDiscount(
      request,
      baseDiscount,
      code,
      parsedUsageLimit,
      appliesOncePerCustomer,
      customerSelection,
      {
        metafieldId: configuration.metafieldId,
        markets: configuration.markets || [],
      },
    );
  } else {
    result = await createAutomaticDiscount(request, baseDiscount, {
      metafieldId: configuration.metafieldId,
      markets: configuration.markets || [],
    });
  }

  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  return { success: true };
};
// [END build-the-ui.add-action]

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field: string[];
  }[];
  success?: boolean;
}

interface LoaderData {
  collections: { id: string; title: string }[];
}

export default function VolumeNew() {
  const actionData = useActionData<ActionData>();
  const { collections } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors = actionData?.errors || [];

  if (actionData?.success) {
    returnToDiscounts();
  }

  const initialData = {
    title: "",
    method: DiscountMethod.Code,
    code: "",
    discountClasses: [],
    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: null,
    appliesOncePerCustomer: false,
    startsAt: new Date(),
    endsAt: null,
    configuration: {
      metafieldId: undefined,
      markets: [],
    },
  };

  return (
    <Page>
      <ui-title-bar title="Create product, order, and shipping discount">
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        collections={collections}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </Page>
  );
}
