import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DGN Club - Convite Founders",
  description: "Convite reservado para Membros Fundadores DGN Club.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
