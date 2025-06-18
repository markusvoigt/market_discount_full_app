import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").DeliveryDiscountInput} RunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    throw new Error("No delivery groups found");
  }

  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping
  );

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  let config = {};
  if (input.discount.metafield?.value) {
    try {
      config = JSON.parse(input.discount.metafield.value);
    } catch (e) {
      console.error("Failed to parse metafield configuration:", e);
      config = {};
    }
  }

  let marketConfig = null;
  if (Array.isArray(config.markets)) {
    // First try to match by market ID as it's the most precise identifier
    if (input.localization?.market?.id) {
      marketConfig = config.markets.find(
        (m) => m.marketId === input.localization.market.id && m.active
      );
    }

    // If no match by market ID, try country code
    if (!marketConfig && input.localization?.country?.isoCode) {
      const countryCode = input.localization.country.isoCode;
      marketConfig = config.markets.find(
        (m) => m.countryCode === countryCode && m.active
      );
    }
  }

  if (!marketConfig) {
    console.log("No matching market configuration found");
    return { operations: [] };
  }

  // Use marketConfig only if active
  const deliveryType = marketConfig.deliveryType || "percentage";
  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  const deliveryPercentage = safeNumber(marketConfig.deliveryPercentage);
  const deliveryFixed = safeNumber(marketConfig.deliveryFixed);

  // Create discount candidates for each delivery option
  const candidates = firstDeliveryGroup.deliveryOptions
    .map((option) => {
      let value, message;
      if (deliveryType === "fixed" && deliveryFixed > 0) {
        value = { fixedAmount: { amount: deliveryFixed.toFixed(2) } };
        message = `${deliveryFixed} ${option.cost.currencyCode} OFF DELIVERY`;
      } else if (deliveryPercentage > 0) {
        value = { percentage: { value: deliveryPercentage } };
        message = `${deliveryPercentage}% OFF DELIVERY`;
      } else {
        return null;
      }

      return {
        message,
        targets: [
          {
            deliveryOption: {
              handle: option.handle,
            },
          },
        ],
        value,
      };
    })
    .filter(Boolean); // Remove any null entries

  if (candidates.length === 0) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates,
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
