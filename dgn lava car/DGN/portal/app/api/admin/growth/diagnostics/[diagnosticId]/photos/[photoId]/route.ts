import type { NextRequest } from "next/server";
import { handlePhotoDelete } from "@/lib/growth/db/diagnostics-route";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ diagnosticId: string; photoId: string }> },
) {
  const { diagnosticId, photoId } = await context.params;
  return handlePhotoDelete(request, diagnosticId, photoId);
}
