import {describe, it, expect} from "vitest";

import {cartDeliveryOptionsDiscountsGenerateRun} from "./cart_delivery_options_discounts_generate_run";
import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

describe("cartDeliveryOptionsDiscountsGenerateRun", () => {
  const shopWithDate = {
    localTime: { date: "2025-07-01" },
  };

  const deliveryConfiguration = {
    value: JSON.stringify({
      markets: [
        {
          marketId: "gid://shopify/Market/1",
          marketName: "US",
          currencyCode: "USD",
          deliveryType: "percentage",
          deliveryPercentage: "100",
          deliveryFixed: "0",
          active: true,
          startDate: "2025-06-01",
          endDate: null,
        },
      ],
    }),
  };

  const baseInput = {
    cart: {
      deliveryGroups: [
        {
          id: "gid://shopify/DeliveryGroup/0",
          deliveryOptions: [
            {
              handle: "handle-1",
              title: "Standard",
              cost: { amount: "10.00", currencyCode: "USD" },
            },
          ],
        },
      ],
    },
    localization: {
      market: { id: "gid://shopify/Market/1" },
      country: { isoCode: "US" },
    },
    shop: shopWithDate,
    discount: {
      discountClasses: [DiscountClass.Shipping],
      configuration: deliveryConfiguration,
    },
  };

  it("returns empty operations when no discount classes are present", () => {
    const input = {
      ...baseInput,
      discount: {
        discountClasses: [],
        configuration: deliveryConfiguration,
      },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toHaveLength(0);
  });

  it("returns delivery discount when shipping discount class is present", () => {
    const result = cartDeliveryOptionsDiscountsGenerateRun(baseInput);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      deliveryDiscountsAdd: {
        candidates: [
          {
            targets: [
              {
                deliveryOption: {
                  handle: "handle-1",
                },
              },
            ],
            value: {
              percentage: {
                value: 100,
              },
            },
          },
        ],
        selectionStrategy: DeliveryDiscountSelectionStrategy.All,
      },
    });
  });

  it("throws error when no delivery groups are present", () => {
    const input = {
      ...baseInput,
      cart: {
        deliveryGroups: [],
      },
    };

    expect(() => cartDeliveryOptionsDiscountsGenerateRun(input)).toThrow(
      "No delivery groups found",
    );
  });
});
