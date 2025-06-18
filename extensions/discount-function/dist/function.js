// node_modules/@shopify/shopify_function/run.ts
function run_default(userfunction) {
  try {
    ShopifyFunction;
  } catch (e) {
    throw new Error(
      "ShopifyFunction is not defined. Please rebuild your function using the latest version of Shopify CLI."
    );
  }
  const input_obj = ShopifyFunction.readInput();
  const output_obj = userfunction(input_obj);
  ShopifyFunction.writeOutput(output_obj);
}

// extensions/discount-function/src/cart_lines_discounts_generate_run.js
function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    throw new Error("No cart lines found");
  }
  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    "ORDER" /* Order */
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    "PRODUCT" /* Product */
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
  const presentmentCurrency = input.cart?.buyerIdentity?.presentmentCurrencyCode || input.cart?.presentmentCurrencyCode;
  console.log("Input localization:", input.localization);
  console.log("Markets config:", config.markets);
  console.log("Presentment currency:", presentmentCurrency);
  let marketConfig = null;
  if (Array.isArray(config.markets)) {
    if (input.localization?.country?.isoCode) {
      const countryCode = input.localization.country.isoCode;
      marketConfig = config.markets.find((m) => {
        if (countryCode === "CA" && m.marketName.includes("Canada") && m.active) {
          return true;
        }
        if (countryCode === "DE" && m.marketName.includes("Germany") && m.active) {
          return true;
        }
        return false;
      });
    }
    if (!marketConfig && input.localization?.market?.id) {
      marketConfig = config.markets.find(
        (m) => m.marketId === input.localization.market.id && m.active
      );
    }
    if (!marketConfig && presentmentCurrency) {
      marketConfig = config.markets.find(
        (m) => m.currencyCode === presentmentCurrency && m.active
      );
    }
  }
  console.log("Selected market config:", marketConfig);
  if (!marketConfig) {
    console.log("No matching market configuration found");
    return { operations: [] };
  }
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
                    excludedCartLineIds: []
                  }
                }
              ],
              value
            }
          ],
          selectionStrategy: "FIRST" /* First */
        }
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
      const eligibleLines = input.cart.lines.filter((line) => {
        if (!marketConfig.excludeOnSale) return true;
        const compareAtAmount = line.cost?.compareAtAmountPerQuantity?.amount;
        if (!compareAtAmount) return true;
        const compareAtPrice = parseFloat(compareAtAmount);
        const currentPrice = parseFloat(line.cost.subtotalAmount.amount) / line.quantity;
        return compareAtPrice <= currentPrice;
      });
      if (eligibleLines.length > 0) {
        operations.push({
          productDiscountsAdd: {
            candidates: [
              {
                message,
                targets: eligibleLines.map((line) => ({
                  cartLine: {
                    id: line.id
                  }
                })),
                value
              }
            ],
            selectionStrategy: "ALL" /* All */
          }
        });
      }
    }
  }
  return {
    operations
  };
}

// extensions/discount-function/src/cart_delivery_options_discounts_generate_run.js
function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    throw new Error("No delivery groups found");
  }
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    "SHIPPING" /* Shipping */
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
  const countryIsoCode = input.localization?.country?.isoCode;
  const presentmentCurrency = input.cart?.buyerIdentity?.presentmentCurrencyCode || input.cart?.presentmentCurrencyCode;
  let marketConfig = null;
  if (Array.isArray(config.markets)) {
    if (countryIsoCode) {
      marketConfig = config.markets.find(
        (m) => m.marketId === countryIsoCode && m.active
      );
    }
    if (!marketConfig && presentmentCurrency) {
      marketConfig = config.markets.find(
        (m) => m.currencyCode === presentmentCurrency && m.active
      );
    }
  }
  if (!marketConfig) {
    return { operations: [] };
  }
  const deliveryType = marketConfig.deliveryType || "percentage";
  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  const deliveryPercentage = safeNumber(marketConfig.deliveryPercentage);
  const deliveryFixed = safeNumber(marketConfig.deliveryFixed);
  const value = deliveryType === "fixed" && deliveryFixed > 0 ? { fixedAmount: { value: deliveryFixed } } : deliveryPercentage > 0 ? { percentage: { value: deliveryPercentage } } : null;
  if (!value) {
    return { operations: [] };
  }
  const currencySymbol = presentmentCurrency ? getCurrencySymbol(presentmentCurrency) : "$";
  function getCurrencySymbol(code) {
    const symbols = {
      USD: "$",
      EUR: "\u20AC",
      GBP: "\xA3",
      CAD: "$",
      AUD: "$",
      JPY: "\xA5"
    };
    return symbols[code] || code;
  }
  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: value.fixedAmount ? `${value.fixedAmount.value}${currencySymbol} OFF DELIVERY` : `${value.percentage.value}% OFF DELIVERY`,
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id
                  }
                }
              ],
              value
            }
          ],
          selectionStrategy: "ALL" /* All */
        }
      }
    ]
  };
}

// <stdin>
function cartLinesDiscountsGenerateRun2() {
  return run_default(cartLinesDiscountsGenerateRun);
}
function cartDeliveryOptionsDiscountsGenerateRun2() {
  return run_default(cartDeliveryOptionsDiscountsGenerateRun);
}
export {
  cartDeliveryOptionsDiscountsGenerateRun2 as cartDeliveryOptionsDiscountsGenerateRun,
  cartLinesDiscountsGenerateRun2 as cartLinesDiscountsGenerateRun
};
