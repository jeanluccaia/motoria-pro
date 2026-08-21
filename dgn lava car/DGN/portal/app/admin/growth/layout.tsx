import type { ReactNode } from "react";
import { DgnAdminShell } from "@/components/admin/DgnAdminShell";

export default function DgnAdminGrowthLayout({ children }: { children: ReactNode }) {
  return <DgnAdminShell>{children}</DgnAdminShell>;
}
