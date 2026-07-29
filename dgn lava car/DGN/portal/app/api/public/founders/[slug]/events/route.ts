import { NextRequest, NextResponse } from "next/server";
import { resolveFounderPublicLink } from "@/lib/founder-public-links";
import { buildDedupeKey, founderCookieOptions, FOUNDER_VISITOR_COOKIE, isFounderEvent, isKnownPreviewBot } from "@/lib/founder-tracking";
import { getSupabaseAdminClient } from "@/lib/growth/db/admin-client";

const generic = () => NextResponse.json({ accepted: true }, { status: 202 });

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const response = generic();
  if (request.nextUrl.searchParams.get("preview") === "1" || isKnownPreviewBot(request.headers.get("user-agent") ?? "")) return response;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || Object.keys(payload).length !== 1 || !isFounderEvent(payload.event)) return response;
  const { slug } = await params;
  const resolved = await resolveFounderPublicLink(slug);
  if (!resolved) return response;

  let visitorId = request.cookies.get(FOUNDER_VISITOR_COOKIE)?.value;
  if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
    visitorId = crypto.randomUUID();
    response.cookies.set(FOUNDER_VISITOR_COOKIE, visitorId, founderCookieOptions(process.env.NODE_ENV === "production"));
  }
  try {
    await getSupabaseAdminClient("founder.public-tracking").rpc("crm_track_founder_public_event", {
      p_customer_legacy_id: resolved.customerLegacyId, p_campaign_id: "founders-2026", p_event_type: payload.event,
      p_anonymous_visitor_id: visitorId, p_dedupe_key: buildDedupeKey(visitorId, resolved.slug, payload.event),
    });
  } catch { /* tracking nunca interfere no CTA ou na pagina */ }
  return response;
}
