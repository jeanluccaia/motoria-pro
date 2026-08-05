import "server-only";

import { notFound } from "next/navigation";
import { FounderPageClient } from "@/components/FounderPageClient";
import { FounderNeutralPage } from "@/components/FounderNeutralPage";
import { FounderSnapshotPage } from "@/components/FounderSnapshotPage";
import { normalizeLegacyFounderSnapshot } from "@/lib/founder-offer-catalog";
import { resolveFounderPublicLink } from "@/lib/founder-public-links";
import { getFounderBySlug } from "@/lib/founders-data";

export async function renderFounderPublicPage(slug: string) {
  const resolved = await resolveFounderPublicLink(slug);
  if (!resolved) notFound();
  const approvedFounder = getFounderBySlug(resolved.slug);
  if (approvedFounder) return <FounderPageClient founder={approvedFounder} />;
  const snapshot = normalizeLegacyFounderSnapshot(resolved.offerSnapshot);
  if (snapshot && typeof snapshot.monthlyPrice === "number" && snapshot.monthlyPrice > 0) {
    return <FounderSnapshotPage slug={resolved.slug}
      firstName={resolved.publicName.trim().split(/\s+/)[0] || "Cliente"}
      offer={snapshot} message={resolved.messagePublic ?? ""} />;
  }
  return <FounderNeutralPage slug={resolved.slug} name={resolved.publicName} isTest={resolved.isTest} />;
}
