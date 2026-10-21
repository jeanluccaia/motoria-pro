"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/supabase/types";
import loudfitLockup from "@/../public/brand/loudfit-lockup.png";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  disabled?: boolean;
};

// Fase atual: Loud Flow operacional só para o CRM de Franquias da franqueadora.
// Tarefas / Resultados / Início / módulos de unidade permanecem no código
// mas ficam fora da navegação até serem recolocados. Admins mantêm acesso
// a Configurações para gestão de usuários e permissões.
const nav: NavItem[] = [
  { href: "/crm/franquias", label: "CRM de Franquias", icon: Users, roles: ["admin", "marketing", "partner"] },
  { href: "/config", label: "Configurações", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const items = nav.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <aside className="sticky top-0 hidden h-svh w-56 shrink-0 border-r border-border bg-lf-graphite md:flex md:flex-col">
      <div className="flex flex-col gap-1.5 px-6 py-6">
        <Image
          src={loudfitLockup}
          alt="Loud Fit"
          className="h-7 w-auto"
          sizes="128px"
          priority
        />
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-lf-muted">
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

  // Grid dinâmico (3 a 5 itens dependendo do perfil). Tailwind precisa das
  // classes literais no bundle; por isso o switch explícito.
  const colsClass =
    items.length === 5
      ? "grid-cols-5"
      : items.length === 4
        ? "grid-cols-4"
        : items.length === 3
          ? "grid-cols-3"
          : "grid-cols-2";

  return (
    <nav className={cn("sticky bottom-0 z-30 grid border-t border-border bg-lf-graphite md:hidden", colsClass)}>
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
