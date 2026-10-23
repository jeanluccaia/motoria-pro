import type { NextRequest } from "next/server";
import { handleAgentActionsList } from "@/lib/growth/db/agent-actions-route";

export async function GET(request: NextRequest) {
  return handleAgentActionsList(request);
}
