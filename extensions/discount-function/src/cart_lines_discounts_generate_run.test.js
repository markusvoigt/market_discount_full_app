import { describe, it, expect } from "vitest";
import { cartLinesDiscountsGenerateRun } from "./cart_lines_discounts_generate_run";
import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

function makeInput(overrides = {}) {
  return {
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/0",
          quantity: 1,
          cost: {
            subtotalAmount: { amount: "100" },
            compareAtAmountPerQuantity: null,
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
              excludeOnSale: false,
            },
          ],
        }),
      },
    },
    localization: {
      market: { id: "gid://shopify/Market/1" },
      country: { isoCode: "US" },
      language: { isoCode: "EN" },
    },
    shop: {
      localTime: { date: "2026-01-15" },
    },
    ...overrides,
  };
}

describe("cartLinesDiscountsGenerateRun", () => {
  it("returns product discount for matching market", () => {
    const result = cartLinesDiscountsGenerateRun(makeInput());
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].productDiscountsAdd).toBeDefined();
    expect(
      result.operations[0].productDiscountsAdd.candidates[0].value.percentage.value
    ).toBe(10);
  });

  it("returns empty operations when no matching market", () => {
    const input = makeInput({
      localization: {
        market: { id: "gid://shopify/Market/999" },
        country: { isoCode: "XX" },
        language: { isoCode: "EN" },
      },
    });
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns empty operations when all items on sale and excludeOnSale is enabled", () => {
    const input = makeInput({
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
    });
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("applies discount when compareAt equals price (not on sale)", () => {
    const input = makeInput({
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
    });
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].productDiscountsAdd).toBeDefined();
  });

  it("returns empty operations when no cart lines", () => {
    const input = makeInput({ cart: { lines: [] } });
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns empty operations when discount class does not include Product", () => {
    const input = makeInput({
      discount: {
        discountClasses: [DiscountClass.Shipping],
        configuration: { value: "{}" },
      },
    });
    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });
});
