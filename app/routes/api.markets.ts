import { json } from "@remix-run/node";
import { GET_MARKETS } from "../graphql/discounts";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: { request: Request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_MARKETS);
  const responseJson = await response.json();
  const markets = responseJson?.data?.markets?.nodes || [];
  return json({ markets });
}; 