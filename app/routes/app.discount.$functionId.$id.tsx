import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { Collection, DiscountClass } from "../types/admin.types.d";
import { json } from "@remix-run/node";
import { useMemo } from "react";

import { DiscountForm } from "../components/DiscountForm/DiscountForm";
import { NotFoundPage } from "../components/NotFoundPage";
import { getCollectionsByIds } from "../models/collections.server";
import {
  getDiscount,
  updateAutomaticDiscount,
  updateCodeDiscount,
} from "../models/discounts.server";
import { DiscountMethod } from "../types/types";
import { returnToDiscounts } from "../utils/navigation";

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field?: string[];
  }[];
  success?: boolean;
}

interface LoaderData {
  discount: {
    id: string;
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
    startsAt: string;
    endsAt: string | null;
    configuration: {
      metafieldId: string;
      collectionIds: string[];
      markets: any[];
    };
    customerSelection: any;
  } | null;
  collections: Collection[];
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { id, functionId } = params;
  if (!id) throw new Error("No discount ID provided");

  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string") {
    throw new Error("No discount data provided");
  }

  const {
    title,
    method,
    code,
    combinesWith,
    discountClasses,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    customerSelection,
    configuration,
  } = JSON.parse(discountData);

  const parsedUsageLimit = usageLimit ? parseInt(String(usageLimit), 10) : null;

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    discountClasses,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };

  // Parse configuration values
  const parsedConfiguration = {
    metafieldId: configuration.metafieldId,
    collectionIds: configuration.collectionIds || [],
    markets: configuration.markets || [],
  };

  let result;

  if (method === DiscountMethod.Code) {
    result = await updateCodeDiscount(
      request,
      id,
      baseDiscount,
      code,
      parsedUsageLimit,
      appliesOncePerCustomer,
      customerSelection,
      parsedConfiguration,
    );
  } else {
    result = await updateAutomaticDiscount(
      request,
      id,
      baseDiscount,
      parsedConfiguration,
    );
  }
  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  return { success: true };
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) throw new Error("No discount ID provided");

  const rawDiscountData = await getDiscount(request, id);

  if (!rawDiscountData || !rawDiscountData.discount) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const { discount } = rawDiscountData;

  // Fetch collections if they exist in the configuration
  const collections = discount.configuration?.collectionIds
    ? await getCollectionsByIds(
        request,
        discount.configuration.collectionIds.map((id: string) =>
          id.startsWith("gid://") ? id : `gid://shopify/Collection/${id}`,
        ),
      )
    : [];

  return json({
    discount,
    collections,
  });
};

export default function VolumeEdit() {
  const actionData = useActionData<ActionData>();
  const { discount: rawDiscount, collections } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors =
    actionData?.errors?.map((error) => ({
      ...error,
      field: error.field || [],
    })) || [];

  if (!rawDiscount) {
    return <NotFoundPage />;
  }

  // The discount data is now correctly shaped by the loader.
  const initialData = useMemo(
    () => ({
      ...rawDiscount,
      discountType:
        rawDiscount.discountClasses?.includes(DiscountClass.Shipping)
          ? "shipping"
          : "products_order",
    }),
    [rawDiscount],
  );

  return (
    <Page>
      <ui-title-bar title={`Edit ${rawDiscount.title}`}>
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        key={rawDiscount.id}
        initialData={initialData}
        collections={collections}
        isEditing={true}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </Page>
  );
}
