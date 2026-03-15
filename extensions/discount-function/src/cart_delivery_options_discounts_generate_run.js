import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

function isValidDateRange(marketConfig, shop) {
  const now = new Date(shop.localTime.date);
  const startDate = marketConfig.startDate
    ? new Date(marketConfig.startDate)
    : null;
  const endDate = marketConfig.endDate ? new Date(marketConfig.endDate) : null;

  if (!startDate && !endDate) {
    return true;
  }
  if (startDate && !endDate) {
    return startDate <= now;
  }
  if (!startDate && endDate) {
    return endDate >= now;
  }
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
  const { cart, discount, localization, shop } = input;

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
    if (localization?.market?.id) {
      marketConfig = configuration.markets.find(
        (m) => m.marketId === localization.market.id && m.active
      );
    }

    if (!marketConfig && localization?.country?.isoCode) {
      const countryCode = localization.country.isoCode;
      marketConfig = configuration.markets.find(
        (m) => m.countryCode === countryCode && m.active
      );
    }
  }

  if (!marketConfig) {
    return { operations: [] };
  }

  if (!isValidDateRange(marketConfig, shop)) {
    return { operations: [] };
  }

  const deliveryType = marketConfig.deliveryType || "percentage";
  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  const deliveryPercentage = safeNumber(marketConfig.deliveryPercentage);
  const deliveryFixed = safeNumber(marketConfig.deliveryFixed);

  const message = configuration.title;

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
    .filter(Boolean);

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
