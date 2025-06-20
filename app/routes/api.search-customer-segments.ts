import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { searchCustomerSegments } from "../models/customer-segments.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || "";

  if (!query) {
    return json({ customerSegments: [] });
  }

  const customerSegments = await searchCustomerSegments(admin.graphql, query);

  return json({ customerSegments });
} 