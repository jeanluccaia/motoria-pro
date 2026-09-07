import type { NextRequest } from "next/server";
import {
  handlePortalAccessDelete,
  handlePortalAccessGet,
  handlePortalAccessPatch,
  handlePortalAccessPost,
} from "@/lib/growth/db/portal-access-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handlePortalAccessGet(request, id);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handlePortalAccessPost(request, id);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handlePortalAccessPatch(request, id);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handlePortalAccessDelete(request, id);
}
