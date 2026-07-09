"use client";

import { FounderPageClient } from "@/components/FounderPageClient";
import { getFounderBySlug } from "@/lib/founders-data";

const founder = getFounderBySlug("benedito-constantino")!;

export default function BeneditoCostantinoFounderPage() {
  return <FounderPageClient founder={founder} />;
}
