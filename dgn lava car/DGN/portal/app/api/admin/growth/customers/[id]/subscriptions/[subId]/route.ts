import type { NextRequest } from "next/server";
import {
  handleSubscriptionsDelete,
  handleSubscriptionsPatch,
} from "@/lib/growth/db/subscriptions-route";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; subId: string }> },
) {
  const { id, subId } = await context.params;
  return handleSubscriptionsPatch(request, id, subId);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; subId: string }> },
) {
  const { id, subId } = await context.params;
  return handleSubscriptionsDelete(request, id, subId);
}
