// These enums are used as API types
export enum DiscountMethod {
  Code = "CODE",
  Automatic = "AUTOMATIC",
}

export enum RequirementType {
  None = "NONE",
  Subtotal = "SUBTOTAL",
  Quantity = "QUANTITY",
}

export interface Customer {
  id: string;
  displayName: string;
  email: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
}
