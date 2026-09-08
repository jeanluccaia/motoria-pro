import type { NextRequest } from "next/server";
import {
  handleAppointmentsDelete,
  handleAppointmentsGet,
  handleAppointmentsPost,
} from "@/lib/growth/db/appointments-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAppointmentsGet(request, id);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAppointmentsPost(request, id);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleAppointmentsDelete(request, id);
}
