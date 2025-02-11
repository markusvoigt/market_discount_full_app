# Example App to generate Shopify Product Discount Function to limit discounts to certain markets and optionally exclude line items on sale

## Overview

This Remix app extends [this repo](https://github.com/markusvoigt/market_discount) with a full embedded UI to add and manage market-specific discounts in Shopify. 
The app allows to generate fixed and percentage-based discounts that only work in selected markets and optionally don't apply to line items that are already on sale (based on the compare_at price) in that market.

**[Demo](https://screenshot.click/11-45-7w3gg-v9b8j.mp4)**

## Features

- **Market-Specific Discounts**: Applies discounts only to products in specified markets (`de`, `usa`).
- **Exclusion of Sale Items**: Automatically excludes products that are already on sale from receiving additional discounts.
- **Dynamic Discount Application**: Discounts are applied dynamically based on the cart contents and market during the checkout process.

## Requirements

- Shopify plan that supports Shopify Functions.
- Hosting for the app. I used Heroku.

## Setup

To set up this project:

1. Clone this project:
   `git clone https://github.com/markusvoigt/market_discount_full_app.git`
2.  Install dependencies: `npm install`
3. Create a new Shopify app using [the Shopify CLI](https://shopify.dev/docs/apps/build/scaffold-app):
  `shopify app init`

## Configuration

- **Market Handles**:
  - Select or unselect the market handles where you want your discount to be active.
  
- **Sale Item Exclusion**:
  - Selecting "Exclude line items on sale" will not apply any discounts to line item that have a compare_at price > product price in the active market.


## Support

For further assistance, please consult [the relevant developer documentation](https://shopify.dev/docs/api/functions/reference/product-discounts).

