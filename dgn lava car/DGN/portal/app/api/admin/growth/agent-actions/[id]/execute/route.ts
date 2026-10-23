import type { NextRequest } from "next/server";
import { handleAgentActionExecute } from "@/lib/growth/db/agent-actions-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAgentActionExecute(request, id);
}
