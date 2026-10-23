import type { NextRequest } from "next/server";
import { handleManagerAcceptCounter } from "@/lib/growth/db/corporate-fleet-route";

export async function POST(request: NextRequest, context: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await context.params;
  return handleManagerAcceptCounter(request, reqId);
}
