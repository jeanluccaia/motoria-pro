import type { NextRequest } from "next/server";
import {
  handleDiagnosticGet,
  handleDiagnosticPatch,
} from "@/lib/growth/db/diagnostics-route";

export async function GET(request: NextRequest, context: { params: Promise<{ diagnosticId: string }> }) {
  const { diagnosticId } = await context.params;
  return handleDiagnosticGet(request, diagnosticId);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ diagnosticId: string }> }) {
  const { diagnosticId } = await context.params;
  return handleDiagnosticPatch(request, diagnosticId);
}
