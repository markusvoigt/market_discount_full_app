import { DiscountClass } from "./admin.types";
import { DiscountMethod } from "./types";

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
  endDate?: string;
  excludeOnSale?: boolean;
  active?: boolean;
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
