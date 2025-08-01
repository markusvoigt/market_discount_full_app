// Queries
export const GET_ALL_DISCOUNTS = `
  query GetAllDiscounts {
    discountNodes(
      first: 50,
      query: "app:example-discounts--ui-extension"
    ) {
      nodes {
        id
        discount {
          __typename
          ... on DiscountAutomaticApp {
            title
            status
            startsAt
            endsAt
            discountClass
            createdAt
            discountId
          }
          ... on DiscountCodeApp {
            title
            status
            startsAt
            endsAt
            discountClass
            createdAt
            discountId
            codes(first: 1) {
              nodes {
                code
              }
            }
          }
        }
        metafield(
          namespace: "$app:example-discounts--ui-extension"
          key: "function-configuration"
        ) {
          value
        }
      }
    }
  }
`;

export const GET_DISCOUNT = `
  query GetDiscount($id: ID!) {
    discountNode(id: $id) {
      id
      metafields(first: 10) {
        edges {
          node {
            id
            namespace
            key
            value
          }
        }
      }
      discount {
        __typename
        ... on DiscountAutomaticApp {
          title
          discountClasses
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          startsAt
          endsAt
        }
        ... on DiscountCodeApp {
          title
          status
          startsAt
          endsAt
          usageLimit
          appliesOncePerCustomer
          discountClasses
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          codes(first: 1) {
            nodes {
              code
            }
          }
          customerSelection {
            __typename
            ... on DiscountCustomerAll {
              __typename
            }
            ... on DiscountCustomers {
              customers {
                id
                displayName
                email
              }
            }
            ... on DiscountCustomerSegments {
              segments {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_MARKETS = `
  query GetMarkets {
    markets(first: 50) {
      nodes {
        id
        name
        status
        currencySettings {
          baseCurrency {
            currencyCode
          }
        }
      }
    }
  }
`;

// Mutations
export const UPDATE_CODE_DISCOUNT = `
  mutation UpdateCodeDiscount($id: ID!, $discount: DiscountCodeAppInput!) {
    discountUpdate: discountCodeAppUpdate(id: $id, codeAppDiscount: $discount) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_AUTOMATIC_DISCOUNT = `
  mutation UpdateAutomaticDiscount(
    $id: ID!
    $discount: DiscountAutomaticAppInput!
  ) {
    discountUpdate: discountAutomaticAppUpdate(
      id: $id
      automaticAppDiscount: $discount
    ) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_CODE_DISCOUNT = `
  mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
    discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
      codeAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_AUTOMATIC_DISCOUNT = `
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(
      automaticAppDiscount: $discount
    ) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const DELETE_CODE_DISCOUNT = `
  mutation DeleteCodeDiscount($id: ID!) {
    discountDelete: discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const DELETE_AUTOMATIC_DISCOUNT = `
  mutation DeleteAutomaticDiscount($id: ID!) {
    discountDelete: discountAutomaticDelete(id: $id) {
      deletedAutomaticDiscountId
      userErrors {
        code
        message
        field
      }
    }
  }
`;