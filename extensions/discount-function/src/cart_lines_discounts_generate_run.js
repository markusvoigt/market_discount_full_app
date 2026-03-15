import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

export function cartLinesDiscountsGenerateRun(input) {
  const { cart, discount, localization, shop } = input;

  if (!cart.lines.length) {
    return { operations: [] };
  }

  const hasProductDiscountClass = discount.discountClasses.includes(
    DiscountClass.Product
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
    return { operations: [] };
  }

  if (!isValidDateRange(marketConfig, shop)) {
    return { operations: [] };
  }

  const message = configuration.title || "Discount";

  let discountValue;
  if (marketConfig.cartLineType === "percentage") {
    discountValue = {
      percentage: {
        value: parseFloat(marketConfig.cartLinePercentage),
      },
    };
  } else {
    discountValue = {
      fixedAmount: {
        amount: parseFloat(marketConfig.cartLineFixed),
        appliesToEachItem: true,
      },
    };
  }

  if (!discountValue) {
    return { operations: [] };
  }

  const eligibleLines = cart.lines.filter((line) => {
    if (marketConfig.excludeOnSale) {
      const compareAt = line.cost.compareAtAmountPerQuantity
        ? Number(line.cost.compareAtAmountPerQuantity.amount)
        : 0;
      const price = line.quantity > 0
        ? Number(line.cost.subtotalAmount.amount) / line.quantity
        : 0;
      if (compareAt > 0 && compareAt > price) {
        return false;
      }
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
                id: line.id,
              },
            },
          ],
          value: discountValue,
        })),
        selectionStrategy: ProductDiscountSelectionStrategy.All,
      },
    },
  ];

  return { operations };
}

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
