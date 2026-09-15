import type { NextRequest } from "next/server";
import { handlePortalInvitePost } from "@/lib/growth/db/portal-invite-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handlePortalInvitePost(request, id);
}
