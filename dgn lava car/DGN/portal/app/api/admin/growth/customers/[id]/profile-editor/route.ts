import type { NextRequest } from "next/server";
import { handleProfileEditorPatch } from "@/lib/growth/db/profile-editor-route";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleProfileEditorPatch(request, id);
}
