export const FOUNDER_EVENTS = ["page_view", "confirm_whatsapp_click", "vip_whatsapp_click"] as const;
export type FounderEvent = (typeof FOUNDER_EVENTS)[number];
export const FOUNDER_VISITOR_COOKIE = "dgn_founder_visitor";
export const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

const BOT_PATTERN = /whatsapp|facebookexternalhit|facebot|googlebot|bingbot|slackbot|discordbot|twitterbot|linkedinbot|telegrambot|skypeuripreview|headlesschrome|preview|unfurl/i;

export function isFounderEvent(value: unknown): value is FounderEvent {
  return typeof value === "string" && (FOUNDER_EVENTS as readonly string[]).includes(value);
}

export function isKnownPreviewBot(userAgent: string) {
  return BOT_PATTERN.test(userAgent);
}

export function buildDedupeKey(visitorId: string, slug: string, event: FounderEvent, now = Date.now()) {
  return `${visitorId}:${slug}:founders-2026:${event}:${Math.floor(now / DEDUPE_WINDOW_MS)}`;
}

export function founderCookieOptions(production: boolean) {
  return { httpOnly: true, secure: production, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 180 };
}
