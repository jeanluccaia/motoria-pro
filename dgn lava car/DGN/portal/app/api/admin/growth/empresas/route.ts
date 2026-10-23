import type { NextRequest } from "next/server";
import { handleCreateCompany } from "@/lib/growth/db/corporate-fleet-route";

export async function POST(request: NextRequest) {
  return handleCreateCompany(request);
}
