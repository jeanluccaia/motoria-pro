import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DGN Club - Convite Founder",
  description: "Convite reservado DGN Club.",
  robots: { index: false, follow: false },
};

export default function DynamicFounderLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
