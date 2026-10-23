import type { NextRequest } from "next/server";
import { handleAdminCounterPropose } from "@/lib/growth/db/corporate-fleet-route";

export async function POST(request: NextRequest, context: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await context.params;
  return handleAdminCounterPropose(request, reqId);
}
