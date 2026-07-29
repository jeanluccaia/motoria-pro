import "server-only";

import { notFound } from "next/navigation";
import { FounderPageClient } from "@/components/FounderPageClient";
import { FounderNeutralPage } from "@/components/FounderNeutralPage";
import { FounderSnapshotPage } from "@/components/FounderSnapshotPage";
import { getFounderOffer, type FounderPlanSnapshot } from "@/lib/founder-offer-catalog";
import { resolveFounderPublicLink } from "@/lib/founder-public-links";
import { getFounderBySlug } from "@/lib/founders-data";

export async function renderFounderPublicPage(slug: string) {
  const resolved = await resolveFounderPublicLink(slug);
  if (!resolved) notFound();
  const approvedFounder = getFounderBySlug(resolved.slug);
  if (approvedFounder) return <FounderPageClient founder={approvedFounder} />;
  const snapshot = resolved.offerSnapshot;
  const canonical = snapshot ? getFounderOffer(snapshot.code) : null;
  if (snapshot && canonical && snapshot.version === canonical.version && snapshot.name === canonical.name &&
    Array.isArray(snapshot.benefits) && Array.isArray(snapshot.publicRules)) {
    return <FounderSnapshotPage slug={resolved.slug} firstName={resolved.publicName.trim().split(/\s+/)[0] || "Cliente"}
      offer={snapshot as unknown as FounderPlanSnapshot} message={resolved.messagePublic ?? ""} />;
  }
  return <FounderNeutralPage slug={resolved.slug} name={resolved.publicName} isTest={resolved.isTest} />;
}
