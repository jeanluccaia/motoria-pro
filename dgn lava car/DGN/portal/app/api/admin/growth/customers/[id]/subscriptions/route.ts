import type { NextRequest } from "next/server";
import {
  handleSubscriptionsGet,
  handleSubscriptionsPost,
} from "@/lib/growth/db/subscriptions-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleSubscriptionsGet(request, id);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleSubscriptionsPost(request, id);
}
