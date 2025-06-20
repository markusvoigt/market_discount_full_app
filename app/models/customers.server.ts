type GraphQLResponse = {
  data: {
    customers: {
      edges: {
        node: {
          id: string;
          displayName: string;
          email: string;
        };
      }[];
    };
  };
};

export async function searchCustomers(graphql: any, query: string) {
  const response = await graphql(
    `
      query searchCustomers($query: String!) {
        customers(first: 10, query: $query) {
          edges {
            node {
              id
              displayName
              email
            }
          }
        }
      }
    `,
    {
      variables: {
        query,
      },
    },
  );

  const result: GraphQLResponse = await response.json();

  return result.data.customers.edges.map((edge) => edge.node);
} 