"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/config", label: "Usuários" },
  { href: "/config/unidades", label: "Unidades" },
];

export function ConfigTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-md border border-border bg-lf-graphite p-1">
      {tabs.map((t) => {
        const active =
          t.href === "/config" ? pathname === "/config" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex h-8 items-center rounded px-3 text-sm font-medium transition-colors lf-focus",
              active
                ? "bg-lf-surface text-foreground"
                : "text-lf-muted hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
