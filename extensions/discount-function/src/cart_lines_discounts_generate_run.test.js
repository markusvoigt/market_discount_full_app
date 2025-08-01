import {describe, it, expect} from "vitest";

import {cartLinesDiscountsGenerateRun} from "./cart_lines_discounts_generate_run";
import {
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
  */

describe("cartLinesDiscountsGenerateRun", () => {
  const baseInput = {
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/0",
          cost: {
            subtotalAmount: {
              amount: 100,
            },
          },
        },
      ],
    },
    discount: {
      discountClasses: [],
    },
  };

  it("returns empty operations when no discount classes are present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [],
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns only order discount when only order discount class is present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [DiscountClass.Order],
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      orderDiscountsAdd: {
        candidates: [
          {
            message: "10% OFF ORDER",
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: 10,
              },
            },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });
  });

  it("returns only product discount when only product discount class is present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [DiscountClass.Product],
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            message: "20% OFF PRODUCT",
            targets: [
              {
                cartLine: {
                  id: "gid://shopify/CartLine/0",
                },
              },
            ],
            value: {
              percentage: {
                value: 20,
              },
            },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    });
  });

  it("returns both discounts when both discount classes are present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [DiscountClass.Order, DiscountClass.Product],
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(2);
    expect(result.operations[0]).toMatchObject({
      orderDiscountsAdd: {
        candidates: [
          {
            message: "10% OFF ORDER",
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: 10,
              },
            },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });

    expect(result.operations[1]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            message: "20% OFF PRODUCT",
            targets: [
              {
                cartLine: {
                  id: "gid://shopify/CartLine/0",
                },
              },
            ],
            value: {
              percentage: {
                value: 20,
              },
            },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    });
  });
});