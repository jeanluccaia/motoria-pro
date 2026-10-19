"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { usePresentation } from "@/components/presentation/PresentationProvider";
import { APPOINTMENTS, SIM_CLOCK, DEMO_UNIT } from "@/lib/data";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  disabled?: boolean;
  matchStartsWith?: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Visão Geral", desc: "Command Center" },
  {
    href: "/clientes",
    label: "Clientes",
    desc: "Busca e perfil 360°",
    matchStartsWith: "/clientes",
  },
  { href: "/agenda", label: "Agenda", desc: "Atendimentos do dia" },
];

const FUTURE_NAV: NavItem[] = [
  { href: "#", label: "Evolução Estética", desc: "Correção · Proteção · Manutenção", disabled: true },
  { href: "#", label: "Gestão de Frotas", desc: "Contrato empresarial", disabled: true },
  { href: "#", label: "Financeiro", desc: "Recorrência · PagBank · NF-e", disabled: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCustomer = pathname?.startsWith("/clientes/") && pathname !== "/clientes";
  const { start } = usePresentation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Trava scroll quando menu mobile aberto
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Esc fecha menu mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-ink-900/60 backdrop-blur-sm">
        <SidebarBrand />
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <NavList
            items={PRIMARY_NAV}
            pathname={pathname}
            onNavigate={() => {}}
          />
          <FutureGroup items={FUTURE_NAV} />
        </nav>
        <SidebarFooter />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 border-b border-white/5 bg-ink-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="h-full max-w-[1400px] mx-auto px-4 lg:px-10 flex items-center gap-4">
            {/* Mobile: menu + logo */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              className="lg:hidden w-10 h-10 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center text-ink-100"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/logo-dgn-clean.png"
                alt="DGN Club"
                width={90}
                height={28}
                priority
                className="h-7 w-auto object-contain"
              />
              <span className="pill bg-white/5 text-ink-200 border border-white/10 text-[10px]">
                Vision
              </span>
            </div>

            <div className="hidden lg:flex flex-1 items-center gap-3 min-w-0">
              <Breadcrumb pathname={pathname} />
            </div>

            <div className="flex-1 lg:hidden" />

            <button
              onClick={start}
              className="btn-ghost hidden md:inline-flex"
              aria-label="Iniciar Modo Apresentação"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Modo Apresentação
            </button>

            <button
              onClick={start}
              className="md:hidden w-10 h-10 rounded-lg border border-gold-400/30 bg-gold-400/10 text-gold-300 flex items-center justify-center"
              aria-label="Iniciar Modo Apresentação"
              title="Modo Apresentação"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
              </svg>
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-xs font-semibold text-ink-100 hidden sm:flex">
              DG
            </div>
          </div>
        </header>

        {/* Breadcrumb mobile */}
        <div className="lg:hidden px-4 py-2 border-b border-white/5 bg-ink-950/60">
          <Breadcrumb pathname={pathname} />
        </div>

        <div
          className={clsx(
            "flex-1 min-w-0",
            isCustomer ? "" : "max-w-[1400px] w-full mx-auto"
          )}
        >
          {children}
        </div>
      </main>

      {/* MENU MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-ink-900 border-r border-white/5 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menu principal"
          >
            <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
              <Image
                src="/logo-dgn-clean.png"
                alt="DGN Club"
                width={100}
                height={32}
                className="h-8 w-auto object-contain"
              />
              <span className="pill bg-white/5 text-ink-200 border border-white/10 text-[10px]">
                Vision
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="ml-auto w-9 h-9 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center text-ink-100"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
              <NavList
                items={PRIMARY_NAV}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
              <FutureGroup items={FUTURE_NAV} />
            </nav>
            <SidebarFooter />
          </aside>
        </div>
      )}
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
      <Image
        src="/logo-dgn-clean.png"
        alt="DGN Club"
        width={120}
        height={38}
        priority
        className="h-9 w-auto object-contain"
      />
      <span className="pill bg-white/5 text-ink-200 border border-white/10 ml-auto text-[10px]">
        Vision
      </span>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="p-4 m-3 rounded-xl border border-white/5 bg-ink-850/80">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold-300">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
        Operação
      </div>
      <p className="mt-2 text-sm text-ink-100">{DEMO_UNIT.name}</p>
      <p className="text-xs text-ink-300">
        {SIM_CLOCK.display} · {APPOINTMENTS.length} atendimentos hoje
      </p>
    </div>
  );
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string | null;
  onNavigate: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const active = item.matchStartsWith
          ? pathname?.startsWith(item.matchStartsWith)
          : pathname === item.href;
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "group flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors",
              active
                ? "bg-white/[0.06] border border-white/10"
                : "hover:bg-white/[0.03] border border-transparent"
            )}
          >
            <div
              className={clsx(
                "mt-1 w-1.5 h-1.5 rounded-full",
                active ? "bg-gold-400" : "bg-ink-500 group-hover:bg-ink-200"
              )}
            />
            <div className="flex flex-col">
              <span
                className={clsx(
                  "text-sm font-medium",
                  active ? "text-white" : "text-ink-100"
                )}
              >
                {item.label}
              </span>
              <span className="text-[11px] text-ink-300 uppercase tracking-wide">
                {item.desc}
              </span>
            </div>
          </Link>
        );
      })}
    </>
  );
}

function FutureGroup({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.03] text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] uppercase tracking-wider text-ink-300 font-medium">
          Visão futura
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={clsx(
            "text-ink-300 transition-transform",
            open && "rotate-180"
          )}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex items-start gap-3 px-3 py-2 rounded-lg"
              title="Módulo previsto para a próxima fase"
            >
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-ink-500 shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm text-ink-200">{it.label}</span>
                  <span className="pill bg-white/5 text-ink-400 border border-white/10 normal-case tracking-normal text-[9px] py-0.5 px-1.5">
                    Em breve
                  </span>
                </div>
                <span className="text-[11px] text-ink-400 uppercase tracking-wide">
                  {it.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Breadcrumb({ pathname }: { pathname: string | null }) {
  if (!pathname) return null;

  const parts: { href: string | null; label: string }[] = [
    { href: "/", label: "DGN Jardins" },
  ];

  if (pathname === "/") {
    parts.push({ href: null, label: "Visão Geral" });
  } else if (pathname === "/clientes") {
    parts.push({ href: null, label: "Clientes" });
  } else if (pathname.startsWith("/clientes/")) {
    parts.push({ href: "/clientes", label: "Clientes" });
    parts.push({ href: null, label: "Perfil 360°" });
  } else if (pathname === "/agenda") {
    parts.push({ href: null, label: "Agenda" });
  } else {
    parts.push({ href: null, label: pathname });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm min-w-0 overflow-hidden"
    >
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-2 min-w-0">
          {i > 0 && <span className="text-ink-500">/</span>}
          {p.href && i < parts.length - 1 ? (
            <Link
              href={p.href}
              className="text-ink-300 hover:text-ink-100 truncate"
            >
              {p.label}
            </Link>
          ) : (
            <span
              className={
                i === parts.length - 1
                  ? "text-white font-medium truncate"
                  : "text-ink-300 truncate"
              }
            >
              {p.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
