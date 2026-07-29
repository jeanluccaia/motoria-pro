import type { NextRequest } from "next/server";
import { handleFounderCurationPost } from "@/lib/growth/db/founder-curation-route";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleFounderCurationPost(request, id);
}
