import type { NextRequest } from "next/server";
import {
  handleVehiclePhotoDelete,
  handleVehiclePhotoPost,
} from "@/lib/growth/db/vehicle-photo-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleVehiclePhotoPost(request, id);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleVehiclePhotoDelete(request, id);
}
