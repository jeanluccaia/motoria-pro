import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./growth/db/admin-client.ts";

export interface ResolvedFounderPublicLink {
  slug: string;
  publicName: string;
  isTest: boolean;
  customerLegacyId: string;
  campaignMemberId: string;
  offerSnapshot?: Record<string, unknown>;
  messagePublic?: string;
}

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type LinkRow = { slug?: unknown; enabled?: unknown; is_test?: unknown; expires_at?: unknown; campaign_member_id?: unknown; offer_snapshot?: unknown; crm_campaign_members?: unknown };

export function normalizeFounderSlug(value: string) {
  const slug = value.trim().toLowerCase();
  return slug.length >= 8 && slug.length <= 100 && SAFE_SLUG.test(slug) ? slug : null;
}

export function parseFounderPublicLink(row: LinkRow | null, now = new Date()): ResolvedFounderPublicLink | null {
  if (!row || row.enabled !== true || typeof row.slug !== "string" || !normalizeFounderSlug(row.slug)) return null;
  if (row.expires_at && new Date(String(row.expires_at)).getTime() <= now.getTime()) return null;
  const member = Array.isArray(row.crm_campaign_members) ? row.crm_campaign_members[0] : row.crm_campaign_members;
  if (!member || typeof member !== "object") return null;
  const record = member as Record<string, unknown>;
  if (record.campaign_id !== "founders-2026" || typeof row.campaign_member_id !== "string") return null;
  const customer = Array.isArray(record.crm_customers) ? record.crm_customers[0] : record.crm_customers;
  if (!customer || typeof customer !== "object") return null;
  const publicCustomer = customer as Record<string, unknown>;
  if (typeof publicCustomer.legacy_id !== "string" || typeof publicCustomer.name !== "string") return null;
  if (row.is_test === true) {
    if (!row.expires_at || !/^teste-founder-[0-9a-f]{8,32}$/.test(row.slug) || record.founder_number != null || !publicCustomer.legacy_id.startsWith("teste-founder-") || publicCustomer.name !== "Cliente Teste Founder") return null;
  }
  const offerSnapshot = row.offer_snapshot && typeof row.offer_snapshot === "object" ? row.offer_snapshot as Record<string, unknown> : undefined;
  const messagePublic = typeof record.recommendation_message_public === "string" && record.recommendation_message_public ? record.recommendation_message_public : undefined;
  return { slug: row.slug, publicName: publicCustomer.name, isTest: row.is_test === true,
    customerLegacyId: publicCustomer.legacy_id, campaignMemberId: row.campaign_member_id,
    ...(offerSnapshot ? { offerSnapshot } : {}), ...(messagePublic ? { messagePublic } : {}) };
}

export async function resolveFounderPublicLink(slugValue: string, db?: SupabaseClient) {
  const slug = normalizeFounderSlug(slugValue);
  if (!slug) return null;
  try {
    const client = db ?? getSupabaseAdminClient("founder.public-link");
    const result = await client.from("crm_founder_public_links").select("slug,enabled,is_test,expires_at,campaign_member_id,offer_snapshot,crm_campaign_members!inner(campaign_id,founder_number,recommendation_message_public,crm_customers!inner(legacy_id,name))").eq("slug",slug).eq("enabled",true).maybeSingle();
    if (result.error) return null;
    return parseFounderPublicLink(result.data as LinkRow | null);
  } catch { return null; }
}
