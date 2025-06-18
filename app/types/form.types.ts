import { DiscountClass } from "./admin.types.d";
import { DiscountMethod } from "./types";

export type DiscountType = "products_order" | "shipping";

interface CombinesWith {
  orderDiscounts: boolean;
  productDiscounts: boolean;
  shippingDiscounts: boolean;
}

export interface MarketConfig {
  marketId: string;
  marketName: string;
  currencyCode: string;
  startDate?: string;
  endDate?: string | null;
  excludeOnSale?: boolean;
  active: boolean;
  cartLineType: 'percentage' | 'fixed';
  cartLinePercentage: string;
  cartLineFixed: string;
  orderType: 'percentage' | 'fixed';
  orderPercentage: string;
  orderFixed: string;
  deliveryType: 'percentage' | 'fixed';
  deliveryPercentage: string;
  deliveryFixed: string;
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
  discountType: DiscountType;
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  startDate: string | Date;
  endDate: string | Date | null;
  configuration: DiscountConfiguration;
}
