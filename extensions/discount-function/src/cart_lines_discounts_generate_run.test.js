import {describe, it, expect} from "vitest";

import {cartLinesDiscountsGenerateRun} from "./cart_lines_discounts_generate_run";
import {
  ProductDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

describe("cartLinesDiscountsGenerateRun", () => {
  const shopWithDate = {
    localTime: { date: "2025-07-01" },
  };

  const marketConfiguration = {
    value: JSON.stringify({
      markets: [
        {
          marketId: "gid://shopify/Market/1",
          marketName: "US",
          currencyCode: "USD",
          cartLineType: "percentage",
          cartLinePercentage: "20",
          cartLineFixed: "0",
          active: true,
          startDate: "2025-06-01",
          endDate: null,
        },
      ],
    }),
  };

  const baseInput = {
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/0",
          quantity: 1,
          cost: {
            subtotalAmount: { amount: "100.00" },
            compareAtAmountPerQuantity: null,
          },
        },
      ],
    },
    localization: {
      market: { id: "gid://shopify/Market/1" },
      country: { isoCode: "US" },
    },
    shop: shopWithDate,
    discount: {
      discountClasses: [DiscountClass.Product],
      configuration: marketConfiguration,
    },
  };

  it("returns empty operations when no discount classes are present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [],
        configuration: marketConfiguration,
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns empty operations when Product discount class is not present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [DiscountClass.Order],
        configuration: marketConfiguration,
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns product discount when Product discount class is present", () => {
    const result = cartLinesDiscountsGenerateRun(baseInput);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
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
        selectionStrategy: ProductDiscountSelectionStrategy.All,
      },
    });
  });

  it("returns empty operations when no configuration is present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [DiscountClass.Product],
      },
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });
});
