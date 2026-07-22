import type { NextRequest } from "next/server";
import { handleCampaignPatch } from "@/lib/growth/db/campaign-route";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleCampaignPatch(request, id);
}
