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
  const { cart, discount, localization, shop, triggeringDiscountCode } = input;
  if (!cart.lines.length) {
    return { operations: [] };
  }
  const hasProductDiscountClass = discount.discountClasses.includes(
    "PRODUCT" /* Product */
  );
  if (!hasProductDiscountClass) {
    return { operations: [] };
  }
  let configuration = {};
  if (discount.configuration?.value) {
    try {
      configuration = JSON.parse(discount.configuration.value);
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
    console.log("No matching market configuration found");
    return { operations: [] };
  }
  if (!isValidDateRange(marketConfig, shop)) {
    console.log("Market configuration date range is not valid");
    return { operations: [] };
  }
  const message = triggeringDiscountCode || configuration.title || "Discount";
  let discountValue;
  if (marketConfig.cartLineType === "percentage") {
    discountValue = {
      percentage: {
        value: parseFloat(marketConfig.cartLinePercentage)
      }
    };
  } else {
    discountValue = {
      fixedAmount: {
        amount: parseFloat(marketConfig.cartLineFixed),
        appliesToEachItem: true
      }
    };
  }
  if (!discountValue) {
    return { operations: [] };
  }
  const eligibleLines = cart.lines.filter((line) => {
    if (marketConfig.excludeOnSale) {
      return line.cost.compareAtAmountPerQuantity == null || Number(line.cost.compareAtAmountPerQuantity.amount) <= 0;
    }
    return true;
  });
  if (eligibleLines.length === 0) {
    return { operations: [] };
  }
  const operations = [
    {
      productDiscountsAdd: {
        candidates: eligibleLines.map((line) => ({
          message,
          targets: [
            {
              cartLine: {
                id: line.id
              }
            }
          ],
          value: discountValue
        })),
        selectionStrategy: "ALL" /* All */
      }
    }
  ];
  return { operations };
}
function isValidDateRange(marketConfig, shop) {
  const now = new Date(shop.localTime.date);
  const startDate = marketConfig.startDate ? new Date(marketConfig.startDate) : null;
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

// extensions/discount-function/src/cart_delivery_options_discounts_generate_run.js
function isValidDateRange2(marketConfig, shop) {
  const now = new Date(shop.localTime.date);
  const startDate = marketConfig.startDate ? new Date(marketConfig.startDate) : null;
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
function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const { cart, discount, localization, shop, triggeringDiscountCode } = input;
  const firstDeliveryGroup = cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    throw new Error("No delivery groups found");
  }
  const hasShippingDiscountClass = discount.discountClasses.includes(
    "SHIPPING" /* Shipping */
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
    console.log("No matching market configuration found");
    return { operations: [] };
  }
  if (!isValidDateRange2(marketConfig, shop)) {
    console.log("Market configuration date range is not valid");
    return { operations: [] };
  }
  const deliveryType = marketConfig.deliveryType || "percentage";
  const safeNumber = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  const deliveryPercentage = safeNumber(marketConfig.deliveryPercentage);
  const deliveryFixed = safeNumber(marketConfig.deliveryFixed);
  const message = triggeringDiscountCode || configuration.title;
  const candidates = firstDeliveryGroup.deliveryOptions.map((option) => {
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
            handle: option.handle
          }
        }
      ],
      value
    };
  }).filter(Boolean);
  if (candidates.length === 0) {
    return { operations: [] };
  }
  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates,
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
