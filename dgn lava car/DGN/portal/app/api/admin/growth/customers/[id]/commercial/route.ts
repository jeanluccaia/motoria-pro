import type { NextRequest } from "next/server";
import { handleCommercialPatch } from "@/lib/growth/db/commercial-route";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleCommercialPatch(request, id);
}
