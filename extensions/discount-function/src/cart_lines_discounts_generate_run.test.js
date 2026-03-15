import { describe, it, expect } from "vitest";
import { cartLinesDiscountsGenerateRun } from "./cart_lines_discounts_generate_run";
import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
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

  it("returns empty operations when no matching market", () => {
    const input = {
      ...baseInput,
      localization: {
        market: { id: "gid://shopify/Market/999" },
        country: { isoCode: "XX" },
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
        configuration: { value: "{}" },
      },
    };
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns empty operations when all items on sale and excludeOnSale is enabled", () => {
    const input = {
      ...baseInput,
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            quantity: 1,
            cost: {
              subtotalAmount: { amount: "80" },
              compareAtAmountPerQuantity: { amount: "100" },
            },
          },
        ],
      },
      discount: {
        discountClasses: [DiscountClass.Product],
        configuration: {
          value: JSON.stringify({
            markets: [
              {
                marketId: "gid://shopify/Market/1",
                active: true,
                cartLineType: "percentage",
                cartLinePercentage: "10",
                excludeOnSale: true,
              },
            ],
          }),
        },
      },
    };
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("applies discount when compareAt equals price (not on sale)", () => {
    const input = {
      ...baseInput,
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            quantity: 1,
            cost: {
              subtotalAmount: { amount: "39.99" },
              compareAtAmountPerQuantity: { amount: "39.99" },
            },
          },
        ],
      },
      discount: {
        discountClasses: [DiscountClass.Product],
        configuration: {
          value: JSON.stringify({
            markets: [
              {
                marketId: "gid://shopify/Market/1",
                active: true,
                cartLineType: "percentage",
                cartLinePercentage: "10",
                excludeOnSale: true,
              },
            ],
          }),
        },
      },
    };
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].productDiscountsAdd).toBeDefined();
  });

  it("returns empty operations when no cart lines", () => {
    const input = {
      ...baseInput,
      cart: { lines: [] },
    };
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });
});
