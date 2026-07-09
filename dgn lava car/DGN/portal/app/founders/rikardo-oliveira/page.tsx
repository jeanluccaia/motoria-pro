"use client";

import { FounderPageClient } from "@/components/FounderPageClient";
import { getFounderBySlug } from "@/lib/founders-data";

const founder = getFounderBySlug("rikardo-oliveira")!;

export default function RikardoOliveiraFounderPage() {
  return <FounderPageClient founder={founder} />;
}
