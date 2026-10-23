import type { NextRequest } from "next/server";
import { handleCreateFleetVehicle } from "@/lib/growth/db/corporate-fleet-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleCreateFleetVehicle(request, id);
}
