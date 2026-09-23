import type { NextRequest } from "next/server";
import { handlePhotoSignedUrl } from "@/lib/growth/db/diagnostics-route";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ diagnosticId: string; photoId: string }> },
) {
  const { diagnosticId, photoId } = await context.params;
  return handlePhotoSignedUrl(request, diagnosticId, photoId);
}
