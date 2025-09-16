# Discountify - Market-Aware Discounts for Shopify

Discountify is a powerful Shopify app that enables merchants to create and manage sophisticated market-specific discounts. Built with Shopify's App Framework and Functions, it allows for granular control over discount rules across different markets and currencies.

## Demo

Watch my [demo video](https://youtu.be/XlxvX66Lwko) to see Discountify in action! The video showcases:

- Creating market-specific discounts
- Setting up shipping discounts
- Managing discount rules
- Real-time discount application

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

### Enterprise Features

- **API Access**: For Enterprise clients, an offline access token is available on the "API Access" page. This token allows for programmatic management of discounts via the Shopify Admin API, enabling integration with external systems and custom workflows.
- **Quick Discount Creation**: A "New Discount" link has been added to the main navigation menu, allowing for quick and easy creation of new market-specific discounts directly from anywhere in the app.

## Prerequisites

- [Node.js](https://nodejs.org/) version 18.x or higher
- [npm](https://www.npmjs.com/) version 9.x or higher
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) version 3.x or higher (install with `npm install -g @shopify/cli @shopify/theme`)
- [Shopify Partner Account](https://partners.shopify.com/) with organization access
- [Shopify Development Store](https://shopify.dev/docs/apps/tools/development-stores)

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd market_discount_full_app
```

### 2. Configure Shopify App Credentials

**IMPORTANT**: You must configure your app credentials before installing dependencies.

1. **Get your app credentials from Shopify Partner Dashboard**:

   - Go to [partners.shopify.com](https://partners.shopify.com)
   - Navigate to your app or create a new app
   - Copy your **Client ID** from the app settings
   - Note your **Organization ID** from the URL (e.g., `partners.shopify.com/3598980/apps` → organization ID is `3598980`)

2. **Update `shopify.app.toml`** with your credentials:

   ```toml
   client_id = "your_client_id_here"
   organization_id = "your_organization_id_here"
   name = "Your App Name"
   application_url = "https://example.com"
   embedded = true
   ```

### 3. Authentication Setup

**Before running any commands**, ensure you're authenticated with the correct Partner account:

```bash
# Logout from any existing session
shopify auth logout

# This will be prompted when you run shopify app dev
# Make sure to login with the Partner account that has access to your organization
```

### 4. Install Dependencies

```bash
# Install main app dependencies
npm install

# Install function extension dependencies
cd extensions/discount-function
npm install
cd ../..
```

### 5. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (if needed)
npx prisma migrate dev
```

### 6. Build and Test the Function

```bash
cd extensions/discount-function

# Generate types for the function
npm run typegen

# Build the function
npm run build

# Run tests to ensure everything works
npm run test

cd ../..
```

### 7. Verify Installation

Before starting development, verify everything is set up correctly:

```bash
# 1. Check that your credentials are properly configured
cat shopify.app.toml | grep -E "client_id|organization_id"

# 2. Verify function builds successfully
cd extensions/discount-function && npm run build && cd ../..

# 3. Test Prisma client generation
npx prisma generate

# 4. Start the app
shopify app dev
```

If all steps complete without errors, you're ready to develop!

## Development

### 1. Start the Development Server

```bash
shopify app dev
```

This command will:

- Start the Remix development server
- Build and watch the Shopify Function
- Set up tunneling for local development
- Prompt you to select a development store

**Note**: If you encounter authentication issues, make sure you're logged in with the correct Partner account that has access to your organization.

### 2. Test the Function Locally

```bash
cd extensions/discount-function
npm run test
```

### 3. Access Your App

Once running, you can access your app through:

- The Shopify admin of your development store
- The app preview URL provided by the CLI

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

### Authentication Issues

#### 1. "You are not a member of the requested organization" (403 Error)

**Problem**: This occurs when your Shopify CLI is authenticated with a Partner account that doesn't have access to the organization specified in `shopify.app.toml`.

**Solution**:

```bash
# 1. Logout from current session
shopify auth logout

# 2. Verify your shopify.app.toml has the correct credentials
# Check that client_id and organization_id match your Partner Dashboard

# 3. Run the app and authenticate with the correct Partner account
shopify app dev
```

#### 2. "Required client_id" Validation Error

**Problem**: The `client_id` field is missing or invalid in `shopify.app.toml`.

**Solution**:

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Find your app and copy the Client ID from the settings
3. Update `shopify.app.toml`:
   ```toml
   client_id = "your_actual_client_id_here"
   organization_id = "your_org_id_here"
   ```

### Function Build Issues

#### 3. "Cannot convert undefined or null to object" Function Build Error

**Problem**: The Shopify Function extension dependencies are not properly installed or built.

**Solution**:

```bash
# 1. Install function dependencies
cd extensions/discount-function
npm install

# 2. Generate types
npm run typegen

# 3. Build the function
npm run build

# 4. Return to main directory
cd ../..

# 5. Try running the app again
shopify app dev
```

### Database Issues

#### 4. Prisma Client Runtime Errors

**Problem**: Missing Prisma client files or corrupted node_modules.

**Solution**:

```bash
# 1. Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run migrations if needed
npx prisma migrate dev
```

### General Development Issues

#### 5. Port Conflicts

**Problem**: Development server can't start due to port conflicts.

**Solution**:

- The CLI will automatically find available ports
- Check the output for the actual ports being used
- Update your browser bookmarks accordingly

#### 6. Function Not Updating

**Problem**: Changes to the function code aren't reflected in the app.

**Solution**:

```bash
cd extensions/discount-function
npm run build
cd ../..
# Restart shopify app dev
```

#### 7. Market Configuration Not Showing

**Problem**: The market-specific configuration section appears empty.

**Solution**:

1. Check browser console for JavaScript errors
2. Verify the `/api/markets` endpoint is accessible
3. Ensure you have proper market access scopes: `read_markets`
4. Restart the development server

### Getting Help

If you're still experiencing issues:

1. **Check the logs**: Look at the terminal output for specific error messages
2. **Verify prerequisites**: Ensure all required software versions are installed
3. **Clear cache**: Try clearing browser cache and restarting the development server
4. **Check permissions**: Verify your Partner account has the necessary permissions
5. **Update CLI**: Make sure you're using the latest Shopify CLI version:
   ```bash
   npm update -g @shopify/cli @shopify/theme
   ```

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
