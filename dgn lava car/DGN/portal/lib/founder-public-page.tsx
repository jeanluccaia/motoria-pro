import "server-only";

import { notFound } from "next/navigation";
import { FounderPageClient } from "@/components/FounderPageClient";
import { FounderNeutralPage } from "@/components/FounderNeutralPage";
import { resolveFounderPublicLink } from "@/lib/founder-public-links";
import { getFounderBySlug } from "@/lib/founders-data";

export async function renderFounderPublicPage(slug: string) {
  const resolved = await resolveFounderPublicLink(slug);
  if (!resolved) notFound();
  const approvedFounder = getFounderBySlug(resolved.slug);
  if (approvedFounder) return <FounderPageClient founder={approvedFounder} />;
  return <FounderNeutralPage slug={resolved.slug} name={resolved.publicName} isTest={resolved.isTest} />;
}
