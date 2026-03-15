import { describe, it, expect } from "vitest";
import { cartLinesDiscountsGenerateRun } from "./cart_lines_discounts_generate_run";
import { DiscountClass } from "../generated/api";

describe("Market-specific discounts", () => {
  const shopWithDate = {
    localTime: { date: "2025-07-01" },
  };

  const baseInput = {
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/0",
          quantity: 1,
          cost: {
            subtotalAmount: {
              amount: "1914.0",
            },
            compareAtAmountPerQuantity: null,
          },
        },
      ],
    },
    localization: {
      market: {
        id: "gid://shopify/Market/103251444094",
      },
      country: {
        isoCode: "CA",
      },
    },
    shop: shopWithDate,
    discount: {
      discountClasses: [DiscountClass.Product],
      configuration: {
        value: JSON.stringify({
          collectionIds: [],
          markets: [
            {
              marketId: "gid://shopify/Market/103251444094",
              marketName: "Canada",
              currencyCode: "CAD",
              countryCode: "CA",
              cartLineType: "fixed",
              cartLinePercentage: "0",
              cartLineFixed: "10",
              orderType: "percentage",
              orderPercentage: "0",
              orderFixed: "0",
              deliveryType: "percentage",
              deliveryPercentage: "0",
              deliveryFixed: "0",
              active: true,
              startDate: "2025-06-17",
              endDate: null,
            },
            {
              marketId: "gid://shopify/Market/103251411326",
              marketName: "Germany",
              currencyCode: "EUR",
              countryCode: "DE",
              cartLineType: "fixed",
              cartLinePercentage: "0",
              cartLineFixed: "5",
              orderType: "percentage",
              orderPercentage: "0",
              orderFixed: "0",
              deliveryType: "percentage",
              deliveryPercentage: "0",
              deliveryFixed: "0",
              active: true,
              startDate: "2025-06-17",
              endDate: null,
            },
          ],
        }),
      },
    },
  };

  it("applies correct discount for Canadian market", () => {
    const result = cartLinesDiscountsGenerateRun(baseInput);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            value: {
              fixedAmount: {
                amount: 10,
                appliesToEachItem: true,
              },
            },
            targets: [
              {
                cartLine: {
                  id: "gid://shopify/CartLine/0",
                },
              },
            ],
          },
        ],
      },
    });
  });

  it("applies correct discount for German market", () => {
    const germanInput = {
      ...baseInput,
      localization: {
        market: {
          id: "gid://shopify/Market/103251411326",
        },
        country: {
          isoCode: "DE",
        },
      },
    };

    const result = cartLinesDiscountsGenerateRun(germanInput);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            value: {
              fixedAmount: {
                amount: 5,
                appliesToEachItem: true,
              },
            },
            targets: [
              {
                cartLine: {
                  id: "gid://shopify/CartLine/0",
                },
              },
            ],
          },
        ],
      },
    });
  });

  it("falls back to country code match when market ID not found", () => {
    const fallbackInput = {
      ...baseInput,
      localization: {
        market: {
          id: "gid://shopify/Market/nonexistent",
        },
        country: {
          isoCode: "CA",
        },
      },
    };

    const result = cartLinesDiscountsGenerateRun(fallbackInput);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            value: {
              fixedAmount: {
                amount: 10,
                appliesToEachItem: true,
              },
            },
          },
        ],
      },
    });
  });

  it("returns no operations when no matching market or currency found", () => {
    const noMatchInput = {
      ...baseInput,
      localization: {
        market: {
          id: "gid://shopify/Market/nonexistent",
        },
        country: {
          isoCode: "JP",
        },
      },
    };

    const result = cartLinesDiscountsGenerateRun(noMatchInput);
    expect(result.operations).toHaveLength(0);
  });

  it("respects active flag in market configuration", () => {
    const inactiveMarketInput = {
      ...baseInput,
      discount: {
        ...baseInput.discount,
        configuration: {
          value: JSON.stringify({
            collectionIds: [],
            markets: [
              {
                ...JSON.parse(baseInput.discount.configuration.value)
                  .markets[0],
                active: false,
              },
            ],
          }),
        },
      },
    };

    const result = cartLinesDiscountsGenerateRun(inactiveMarketInput);
    expect(result.operations).toHaveLength(0);
  });
});
