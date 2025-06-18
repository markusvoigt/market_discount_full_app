import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").CartLineDiscountInput} RunInput
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

    // Last resort: try to match by currency if available
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
            // Create separate candidates for each line to ensure fixed amount is applied per line
            candidates: eligibleLines.map((line) => ({
              message: message,
              targets: [
                {
                  cartLine: {
                    id: line.id,
                  },
                },
              ],
              value,
            })),
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
