import type { NextRequest } from "next/server";
import { handleCreateManager } from "@/lib/growth/db/corporate-fleet-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleCreateManager(request, id);
}
