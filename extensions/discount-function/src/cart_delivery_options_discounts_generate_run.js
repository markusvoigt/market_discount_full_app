import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").DeliveryInput} RunInput
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
  if (input.discount.configuration && input.discount.configuration.value) {
    try {
      config = JSON.parse(input.discount.configuration.value);
    } catch (e) {
      config = {};
    }
  }

  // Determine market from input.localization
  const countryIsoCode = input.localization?.country?.isoCode;
  const presentmentCurrency =
    input.cart?.buyerIdentity?.presentmentCurrencyCode ||
    input.cart?.presentmentCurrencyCode;
  let marketConfig = null;
  if (Array.isArray(config.markets)) {
    if (countryIsoCode) {
      marketConfig = config.markets.find(
        (m) => m.marketId === countryIsoCode && m.active
      );
    }
    // Fallback to currencyCode if no id match
    if (!marketConfig && presentmentCurrency) {
      marketConfig = config.markets.find(
        (m) => m.currencyCode === presentmentCurrency && m.active
      );
    }
  }
  if (!marketConfig) {
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
  const value =
    deliveryType === "fixed" && deliveryFixed > 0
      ? { fixedAmount: { value: deliveryFixed } }
      : deliveryPercentage > 0
        ? { percentage: { value: deliveryPercentage } }
        : null;
  if (!value) {
    return { operations: [] };
  }

  // Update message to include currency symbol if available
  const currencySymbol = presentmentCurrency
    ? getCurrencySymbol(presentmentCurrency)
    : "$";
  function getCurrencySymbol(code) {
    // Simple mapping for common currencies, can be expanded
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "$",
      AUD: "$",
      JPY: "¥",
    };
    return symbols[code] || code;
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: value.fixedAmount
                ? `${value.fixedAmount.value}${currencySymbol} OFF DELIVERY`
                : `${value.percentage.value}% OFF DELIVERY`,
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id,
                  },
                },
              ],
              value,
            },
          ],
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
