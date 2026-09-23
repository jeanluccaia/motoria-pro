import type { NextRequest } from "next/server";
import {
  handleDiagnosticsCreate,
  handleDiagnosticsList,
} from "@/lib/growth/db/diagnostics-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleDiagnosticsList(request, id);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleDiagnosticsCreate(request, id);
}
