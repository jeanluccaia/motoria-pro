import type { NextRequest } from "next/server";
import { handleManagerCreateRequest } from "@/lib/growth/db/corporate-fleet-route";

export async function POST(request: NextRequest) {
  return handleManagerCreateRequest(request);
}
