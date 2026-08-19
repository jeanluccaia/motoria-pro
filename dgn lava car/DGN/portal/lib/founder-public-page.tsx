import "server-only";

import { notFound } from "next/navigation";
import { FounderPageClient } from "@/components/FounderPageClient";
import { FounderNeutralPage } from "@/components/FounderNeutralPage";
import { FounderSnapshotPage } from "@/components/FounderSnapshotPage";
import { normalizeLegacyFounderSnapshot } from "@/lib/founder-offer-catalog";
import { resolveFounderPublicLink, resolveRevokedFounderPublicLink } from "@/lib/founder-public-links";
import { getFounderBySlug } from "@/lib/founders-data";

export async function renderFounderPublicPage(slug: string) {
  const resolved = await resolveFounderPublicLink(slug);
  if (!resolved) {
    // Slug ainda existe no banco mas foi revogado (troca de oferta) → não é 404.
    // Página neutra explícita: "Este convite foi atualizado. Fale com a DGN…"
    const revoked = await resolveRevokedFounderPublicLink(slug);
    if (revoked) {
      return <FounderNeutralPage slug={revoked.slug} name={revoked.publicName} isTest={revoked.isTest} variant="revoked" />;
    }
    notFound();
  }
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
