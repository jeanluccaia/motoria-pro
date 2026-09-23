import type { NextRequest } from "next/server";
import { handlePhotoUpload } from "@/lib/growth/db/diagnostics-route";

export async function POST(request: NextRequest, context: { params: Promise<{ diagnosticId: string }> }) {
  const { diagnosticId } = await context.params;
  return handlePhotoUpload(request, diagnosticId);
}
