# Discountify - Market-Aware Discounts for Shopify

Discountify is a powerful Shopify app that enables merchants to create and manage sophisticated market-specific discounts. Built with Shopify's App Framework and Functions, it allows for granular control over discount rules across different markets and currencies.

## Features

### Market-Specific Discounts

- Create discounts with different amounts per market
- Support for local currencies in each market
- Flexible date ranges per market configuration
- Automatic currency conversion handling

### Advanced Discount Rules

- Exclude items that are already on sale
- Support for both automatic and code-based discounts
- Percentage or fixed amount discounts
- Cart line and delivery option discounts

### User-Friendly Interface

- Clean, Shopify-native UI using Polaris components
- Easy-to-use discount configuration
- Overview dashboard of all active discounts
- Market-specific discount management

## Prerequisites

- [Node.js](https://nodejs.org/) version 16.x or higher
- [npm](https://www.npmjs.com/) version 8.x or higher
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) version 3.x or higher
- [Shopify Partner Account](https://partners.shopify.com/)
- [Shopify Development Store](https://shopify.dev/docs/apps/tools/development-stores)

## Setup

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd discountify
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:

   ```env
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SCOPES=write_discounts,read_discounts
   HOST=your_app_host
   ```

4. **Initialize the Database**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Deploy the Function**
   ```bash
   cd extensions/discount-function
   npm install
   shopify app deploy
   ```

## Development

1. **Start the Development Server**

   ```bash
   npm run dev
   ```

2. **Test the Function Locally**
   ```bash
   cd extensions/discount-function
   npm run test
   ```

## Project Structure

```
discountify/
├── app/                      # Main application code
│   ├── components/           # React components
│   ├── graphql/             # GraphQL queries and mutations
│   ├── models/              # Data models and business logic
│   ├── routes/              # App routes and pages
│   └── utils/               # Utility functions
├── extensions/
│   └── discount-function/    # Shopify Function for discount calculation
├── prisma/                   # Database schema and migrations
└── public/                   # Static assets
```

## Key Files

- `app/routes/app._index.tsx`: Main dashboard showing active discounts
- `app/components/DiscountForm/`: Discount configuration form
- `extensions/discount-function/src/`: Discount calculation logic
- `app/models/discounts.server.ts`: Discount data management
- `app/graphql/discounts.ts`: GraphQL operations for discounts

## Testing

Run the test suite:

```bash
npm run test
```

For function-specific tests:

```bash
cd extensions/discount-function
npm run test
```

## Deployment

1. **Deploy the App**

   ```bash
   shopify app deploy
   ```

2. **Deploy Function Updates**
   ```bash
   cd extensions/discount-function
   shopify app deploy
   ```

## Market Configuration

Markets are configured through the app interface with the following options:

- Market ID and name
- Local currency settings
- Discount type (percentage/fixed)
- Sale item exclusion rules
- Date ranges
- Discount amounts

## Troubleshooting

### Common Issues

1. **Function Deployment Fails**

   - Ensure your function code passes all tests
   - Check that your function configuration is valid
   - Verify your Shopify CLI is up to date

2. **Discount Not Applying**

   - Verify market configuration
   - Check date ranges
   - Confirm currency settings
   - Review sale item exclusion rules

3. **Database Issues**
   - Run latest migrations
   - Check database connection string
   - Verify Prisma schema matches your database

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## Acknowledgments

- Built with [Shopify App Framework](https://shopify.dev/docs/apps/getting-started)
- Uses [Shopify Functions](https://shopify.dev/docs/apps/functions)
- UI components from [Polaris](https://polaris.shopify.com/)
