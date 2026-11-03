import "@/components/growth/commercial.css";
import type { ReactNode } from "react";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return <div className="dgn-company">{children}</div>;
}
