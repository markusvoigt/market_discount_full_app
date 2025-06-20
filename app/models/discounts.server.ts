import {
  CREATE_CODE_DISCOUNT,
  CREATE_AUTOMATIC_DISCOUNT,
  UPDATE_CODE_DISCOUNT,
  UPDATE_AUTOMATIC_DISCOUNT,
  GET_DISCOUNT,
  GET_ALL_DISCOUNTS,
  DELETE_CODE_DISCOUNT,
  DELETE_AUTOMATIC_DISCOUNT,
} from "../graphql/discounts";
import { authenticate } from "../shopify.server";
import type { DiscountClass } from "../types/admin.types";
import { DiscountMethod } from "../types/types";
import type { MarketConfig } from "../types/form.types";

interface BaseDiscount {
  functionId?: string;
  title: string;
  discountClasses: DiscountClass[];
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  startsAt: Date;
  endsAt: Date | null;
}

interface DiscountConfiguration {
  metafieldId?: string;
  markets?: MarketConfig[];
}

interface UserError {
  code?: string;
  message: string;
  field?: string[];
}

type DiscountNode = {
  id: string;
  metafield: {
    value: string;
  } | null;
  discount: {
    __typename: 'DiscountAutomaticApp' | 'DiscountCodeApp';
    title: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
    discountId: string;
    discountClass: string;
    codes?: {
      nodes: Array<{
        code: string;
      }>;
    };
  };
};

interface DiscountDeleteResponse {
  data: {
    discountDelete: {
      deletedCodeDiscountId?: string;
      deletedAutomaticDiscountId?: string;
      userErrors: Array<{
        code: string;
        message: string;
        field: string[];
      }>;
    };
  };
  errors?: Array<{
    message: string;
    locations: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

export async function createCodeDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_CODE_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            namespace: "$app:example-discounts--ui-extension",
            key: "function-configuration",
            type: "json",
            value: JSON.stringify({
              markets: (configuration.markets || []).map(market => ({
                marketId: market.marketId,
                marketName: market.marketName,
                currencyCode: market.currencyCode,
                startDate: market.startDate,
                endDate: market.endDate,
                excludeOnSale: market.excludeOnSale,
                active: market.active,
                cartLineType: market.cartLineType,
                cartLinePercentage: market.cartLinePercentage,
                cartLineFixed: market.cartLineFixed,
                orderType: market.orderType,
                orderPercentage: market.orderPercentage,
                orderFixed: market.orderFixed,
                deliveryType: market.deliveryType,
                deliveryPercentage: market.deliveryPercentage,
                deliveryFixed: market.deliveryFixed
              })),
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
    discount: responseJson.data.discountCreate?.codeAppDiscount,
  };
}

export async function createAutomaticDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_AUTOMATIC_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        metafields: [
          {
            namespace: "$app:example-discounts--ui-extension",
            key: "function-configuration",
            type: "json",
            value: JSON.stringify({
              markets: configuration.markets || [],
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
  };
}

export async function updateCodeDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: {
    metafieldId: string;
    collectionIds?: string[];
    markets?: any[];
  },
) {
  const { admin } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountCodeNode/${id}`;

  const response = await admin.graphql(UPDATE_CODE_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              markets: (configuration.markets || []).map(market => ({
                marketId: market.marketId,
                marketName: market.marketName,
                currencyCode: market.currencyCode,
                startDate: market.startDate,
                endDate: market.endDate,
                excludeOnSale: market.excludeOnSale,
                active: market.active,
                cartLineType: market.cartLineType,
                cartLinePercentage: market.cartLinePercentage,
                cartLineFixed: market.cartLineFixed,
                orderType: market.orderType,
                orderPercentage: market.orderPercentage,
                orderFixed: market.orderFixed,
                deliveryType: market.deliveryType,
                deliveryPercentage: market.deliveryPercentage,
                deliveryFixed: market.deliveryFixed
              })),
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  return {
    errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  };
}

export async function updateAutomaticDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  configuration: {
    metafieldId: string;
    collectionIds?: string[];
    markets?: any[];
  },
) {
  const { admin } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountAutomaticApp/${id}`;

  const response = await admin.graphql(UPDATE_AUTOMATIC_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              collectionIds: configuration.collectionIds || [],
              markets: (configuration.markets || []).map(market => ({
                marketId: market.marketId,
                marketName: market.marketName,
                currencyCode: market.currencyCode,
                startDate: market.startDate,
                endDate: market.endDate,
                excludeOnSale: market.excludeOnSale,
                active: market.active,
                cartLineType: market.cartLineType,
                cartLinePercentage: market.cartLinePercentage,
                cartLineFixed: market.cartLineFixed,
                orderType: market.orderType,
                orderPercentage: market.orderPercentage,
                orderFixed: market.orderFixed,
                deliveryType: market.deliveryType,
                deliveryPercentage: market.deliveryPercentage,
                deliveryFixed: market.deliveryFixed
              })),
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  return {
    errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  };
}

export async function getDiscount(request: Request, id: string) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_DISCOUNT, {
    variables: {
      id: `gid://shopify/DiscountNode/${id}`,
    },
  });

  const responseJson = await response.json();
  if (
    !responseJson.data.discountNode ||
    !responseJson.data.discountNode.discount
  ) {
    return { discount: null };
  }

  const method =
    responseJson.data.discountNode.discount.__typename === "DiscountCodeApp"
      ? DiscountMethod.Code
      : DiscountMethod.Automatic;

  const {
    title,
    codes,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
  } = responseJson.data.discountNode.discount;
  const configurationRaw = JSON.parse(
    responseJson.data.discountNode.configurationField.value,
  );
  const now = new Date().toISOString().slice(0, 10);
  const configuration = {
    collectionIds: configurationRaw.collectionIds ?? [],
    metafieldId: responseJson.data.discountNode.configurationField.id,
    markets: (configurationRaw.markets || []).map((market: any) => ({
      ...market,
      startDate: market.startDate || now,
      endDate: market.endDate || null,
    })),
  };

  return {
    discount: {
      title,
      method,
      code: codes?.nodes[0]?.code ?? "",
      combinesWith,
      discountClasses,
      usageLimit: usageLimit ?? null,
      appliesOncePerCustomer: appliesOncePerCustomer ?? false,
      startsAt,
      endsAt,
      configuration,
    },
  };
}

export async function getDiscounts(request: Request) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_ALL_DISCOUNTS);
  const json = await response.json();
  
  // Filter out discounts that:
  // 1. Have no metafield configuration (not created by our app)
  // 2. Are not active or scheduled
  // 3. Have expired
  return json.data.discountNodes.nodes.filter((node: DiscountNode) => {
    // Must have valid metafield configuration
    if (!node.metafield?.value) return false;

    const now = new Date();
    const startDate = new Date(node.discount.startsAt);
    const endDate = node.discount.endsAt ? new Date(node.discount.endsAt) : null;

    // Check if discount is active or scheduled and not expired
    const isActive = node.discount.status === 'ACTIVE' || node.discount.status === 'SCHEDULED';
    const hasNotExpired = !endDate || endDate > now;
    const hasStarted = startDate <= now;

    return isActive && hasNotExpired && hasStarted;
  });
}

export async function deleteDiscount(request: Request, id: string, isCodeDiscount: boolean) {
  const { admin } = await authenticate.admin(request);
  const mutation = isCodeDiscount ? DELETE_CODE_DISCOUNT : DELETE_AUTOMATIC_DISCOUNT;

  const response = await admin.graphql(mutation, {
    variables: { id },
  });

  const data = (await response.json()) as DiscountDeleteResponse;
  
  if (data.errors?.length || data.data?.discountDelete?.userErrors?.length) {
    const errors = data.errors || data.data.discountDelete.userErrors;
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  return {
    deletedId: isCodeDiscount 
      ? data.data.discountDelete.deletedCodeDiscountId 
      : data.data.discountDelete.deletedAutomaticDiscountId
  };
}
