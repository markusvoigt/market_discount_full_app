type GraphQLResponse = {
  data: {
    segments: {
      edges: {
        node: {
          id: string;
          name: string;
        };
      }[];
    };
  };
};

export async function searchCustomerSegments(graphql: any, query: string) {
  const response = await graphql(
    `
      query searchCustomerSegments($query: String!) {
        segments(first: 10, query: $query) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `,
    {
      variables: {
        query: `name:*${query}*`,
      },
    },
  );

  const result: GraphQLResponse = await response.json();

  return result.data.segments.edges.map((edge) => edge.node);
} 