import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { searchCustomers } from "../models/customers.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || "";

  if (!query) {
    return json({ customers: [] });
  }

  const customers = await searchCustomers(admin.graphql, query);

  return json({ customers });
} 