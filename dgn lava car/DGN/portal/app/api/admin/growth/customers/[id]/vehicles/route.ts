import type { NextRequest } from "next/server";
import { handleVehiclesGet } from "@/lib/growth/db/profile-editor-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleVehiclesGet(request, id);
}
