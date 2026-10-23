import type { NextRequest } from "next/server";
import { handleAgentActionApprove } from "@/lib/growth/db/agent-actions-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAgentActionApprove(request, id);
}
