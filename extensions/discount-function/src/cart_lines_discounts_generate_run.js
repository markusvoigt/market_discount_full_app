import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */

export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    throw new Error("No cart lines found");
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product
  );

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
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
  const presentmentCurrency =
    input.cart?.buyerIdentity?.presentmentCurrencyCode ||
    input.cart?.presentmentCurrencyCode;

  // Debug logging
  console.log("Input localization:", input.localization);
  console.log("Markets config:", config.markets);
  console.log("Presentment currency:", presentmentCurrency);

  let marketConfig = null;
  if (Array.isArray(config.markets)) {
    // Try to match by country code first
    if (input.localization?.country?.isoCode) {
      const countryCode = input.localization.country.isoCode;
      marketConfig = config.markets.find((m) => {
        // For Canada (CA), look for a market with "Canada" in the name
        if (
          countryCode === "CA" &&
          m.marketName.includes("Canada") &&
          m.active
        ) {
          return true;
        }
        // For Germany (DE), look for a market with "Germany" in the name
        if (
          countryCode === "DE" &&
          m.marketName.includes("Germany") &&
          m.active
        ) {
          return true;
        }
        return false;
      });
    }

    // If no match by country code, try market ID if available
    if (!marketConfig && input.localization?.market?.id) {
      marketConfig = config.markets.find(
        (m) => m.marketId === input.localization.market.id && m.active
      );
    }

    // Fallback to currencyCode if no market match
    if (!marketConfig && presentmentCurrency) {
      marketConfig = config.markets.find(
        (m) => m.currencyCode === presentmentCurrency && m.active
      );
    }
  }

  // Debug logging
  console.log("Selected market config:", marketConfig);

  if (!marketConfig) {
    console.log("No matching market configuration found");
    return { operations: [] };
  }

  // Use marketConfig only if active
  const cartLineType = marketConfig.cartLineType || "percentage";
  const orderType = marketConfig.orderType || "percentage";
  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  const cartLinePercentage = safeNumber(marketConfig.cartLinePercentage);
  const cartLineFixed = safeNumber(marketConfig.cartLineFixed);
  const orderPercentage = safeNumber(marketConfig.orderPercentage);
  const orderFixed = safeNumber(marketConfig.orderFixed);

  const operations = [];

  if (hasOrderDiscountClass) {
    let value, message;
    if (orderType === "fixed" && orderFixed > 0) {
      value = { fixedAmount: { amount: orderFixed.toFixed(1) } };
      message = `${orderFixed} ${marketConfig.currencyCode} OFF ORDER`;
    } else if (orderPercentage > 0) {
      value = { percentage: { value: orderPercentage } };
      message = `${orderPercentage}% OFF ORDER`;
    } else {
      value = null;
    }
    if (value) {
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: [],
                  },
                },
              ],
              value,
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    }
  }

  if (hasProductDiscountClass) {
    let value, message;
    if (cartLineType === "fixed" && cartLineFixed > 0) {
      value = { fixedAmount: { amount: cartLineFixed.toFixed(1) } };
      message = `${cartLineFixed} ${marketConfig.currencyCode} OFF PRODUCT`;
    } else if (cartLinePercentage > 0) {
      value = { percentage: { value: cartLinePercentage } };
      message = `${cartLinePercentage}% OFF PRODUCT`;
    } else {
      value = null;
    }
    if (value) {
      // Filter out items on sale if excludeOnSale is true for this market
      const eligibleLines = input.cart.lines.filter((line) => {
        if (!marketConfig.excludeOnSale) return true;

        // Check if the item is on sale by comparing current price with compareAtPrice
        const compareAtAmount = line.cost?.compareAtAmountPerQuantity?.amount;
        if (!compareAtAmount) return true;

        const compareAtPrice = parseFloat(compareAtAmount);
        const currentPrice =
          parseFloat(line.cost.subtotalAmount.amount) / line.quantity;

        // If compareAtPrice exists and is higher than current price, item is on sale
        return compareAtPrice <= currentPrice;
      });

      // Only create discount operation if there are eligible lines
      if (eligibleLines.length > 0) {
        operations.push({
          productDiscountsAdd: {
            candidates: [
              {
                message,
                targets: eligibleLines.map((line) => ({
                  cartLine: {
                    id: line.id,
                  },
                })),
                value,
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.All,
          },
        });
      }
    }
  }

  return {
    operations,
  };
}
