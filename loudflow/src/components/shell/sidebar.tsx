"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/supabase/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  disabled?: boolean;
};

const nav: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/resultados", label: "Resultados", icon: LineChart, disabled: true },
  { href: "/config", label: "Configurações", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const items = nav.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <aside className="sticky top-0 hidden h-svh w-56 shrink-0 border-r border-border bg-lf-graphite md:flex md:flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="size-2 bg-lf-volt" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
          Loud Flow
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return item.disabled ? (
            <span
              key={item.href}
              className="flex items-center gap-3 rounded px-3 py-2 text-sm text-lf-muted/60"
              title="Disponível em breve"
            >
              <Icon className="size-4" />
              {item.label}
              <span className="ml-auto text-[10px] uppercase tracking-wide text-lf-muted/60">
                em breve
              </span>
            </span>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors lf-focus",
                active
                  ? "bg-lf-surface text-foreground"
                  : "text-lf-muted hover:bg-lf-surface hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = nav.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-lf-graphite md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const cls = cn(
          "flex flex-col items-center gap-1 py-2 text-[10px] uppercase tracking-wide lf-focus",
          active ? "text-foreground" : "text-lf-muted",
          item.disabled && "text-lf-muted/50",
        );
        return item.disabled ? (
          <span key={item.href} className={cls} aria-disabled>
            <Icon className="size-5" />
            {item.label}
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={cls}>
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
