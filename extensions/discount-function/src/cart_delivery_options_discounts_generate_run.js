import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
 * Helper function to validate if a market configuration's date range is valid
 * @param {Object} marketConfig The market configuration object
 * @param {Object} shop The shop object from the input
 * @returns {boolean} Whether the date range is valid
 */
function isValidDateRange(marketConfig, shop) {
  // Get today's date at start of day in shop's timezone
  const now = new Date(shop.localTime.date);
  const startDate = marketConfig.startDate
    ? new Date(marketConfig.startDate)
    : null;
  const endDate = marketConfig.endDate ? new Date(marketConfig.endDate) : null;

  // If no dates are set, consider it valid
  if (!startDate && !endDate) {
    return true;
  }

  // If only start date is set, check if it's not in the future
  if (startDate && !endDate) {
    // If there's no end date, the discount is valid as long as the start date has passed
    return startDate <= now;
  }

  // If only end date is set, check if it's not in the past
  if (!startDate && endDate) {
    return endDate >= now;
  }

  // Both dates are set, check if current date is within range
  return startDate <= now && endDate >= now;
}

/**
 * @typedef {import("../generated/api").DeliveryDiscountInput} RunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const { cart, discount, localization, shop, triggeringDiscountCode } = input;
  const firstDeliveryGroup = cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    throw new Error("No delivery groups found");
  }

  const hasShippingDiscountClass = discount.discountClasses.includes(
    DiscountClass.Shipping
  );

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  let configuration = {};
  if (discount.metafield?.value) {
    try {
      configuration = JSON.parse(discount.metafield.value);
    } catch (e) {
      console.error("Failed to parse metafield configuration:", e);
      configuration = {};
    }
  }

  let marketConfig = null;
  if (Array.isArray(configuration.markets)) {
    // First try to match by market ID as it's the most precise identifier
    if (localization?.market?.id) {
      marketConfig = configuration.markets.find(
        (m) => m.marketId === localization.market.id && m.active
      );
    }

    // If no match by market ID, try country code
    if (!marketConfig && localization?.country?.isoCode) {
      const countryCode = localization.country.isoCode;
      marketConfig = configuration.markets.find(
        (m) => m.countryCode === countryCode && m.active
      );
    }
  }

  if (!marketConfig) {
    console.log("No matching market configuration found");
    return { operations: [] };
  }

  // Check if the market configuration's date range is valid
  if (!isValidDateRange(marketConfig, shop)) {
    console.log("Market configuration date range is not valid");
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

  const message = triggeringDiscountCode || configuration.title;

  // Create discount candidates for each delivery option
  const candidates = firstDeliveryGroup.deliveryOptions
    .map((option) => {
      let value;
      if (deliveryType === "fixed" && deliveryFixed > 0) {
        value = { fixedAmount: { amount: deliveryFixed.toFixed(2) } };
      } else if (deliveryPercentage > 0) {
        value = { percentage: { value: deliveryPercentage } };
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
