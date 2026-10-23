import type { NextRequest } from "next/server";
import { handleAgentActionReject } from "@/lib/growth/db/agent-actions-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAgentActionReject(request, id);
}
