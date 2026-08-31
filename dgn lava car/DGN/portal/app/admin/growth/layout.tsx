import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DgnAdminShell } from "@/components/admin/DgnAdminShell";

export const metadata: Metadata = {
  // B-18: contexto administrativo tem título próprio — não "Portal do Assinante".
  title: {
    default: "DGN Admin",
    template: "%s · DGN Admin",
  },
};

export default function DgnAdminGrowthLayout({ children }: { children: ReactNode }) {
  return <DgnAdminShell>{children}</DgnAdminShell>;
}
