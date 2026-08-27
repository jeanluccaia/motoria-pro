"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Brain,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const primaryNav: NavItem[] = [
  { href: "/admin/growth", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/growth/intelligence", label: "Inteligência", icon: Brain },
  { href: "/admin/growth/curadoria", label: "Curadoria", icon: UserCheck },
  { href: "/admin/growth/founders-2026", label: "Founders", icon: Crown },
  { href: "/admin/growth/assinantes-detectados", label: "Assinantes", icon: ShieldCheck },
];

// Rotas que não devem ser envolvidas pelo shell (login, callbacks, etc).
const CHROMELESS_PATHS = new Set(["/admin/growth/login"]);

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/admin/growth") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DgnAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isChromeless = CHROMELESS_PATHS.has(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  if (isChromeless) return <>{children}</>;

  return (
    <div className="min-h-dvh bg-[#080808] text-white">
      <MobileTopbar onOpen={() => setDrawerOpen(true)} />

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu DGN Admin">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-white/[0.06] bg-[#0A0A0A] px-4 pb-[env(safe-area-inset-bottom)] pt-4"
            data-testid="admin-shell-drawer"
          >
            <div className="mb-2 flex items-center justify-between">
              <ShellBrand />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.06] text-white/70 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarBody pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0A0A] px-4 py-6 lg:flex" data-testid="admin-shell-sidebar">
          <ShellBrand />
          <SidebarBody pathname={pathname} />
        </aside>

        <main className="min-w-0 flex-1" data-testid="admin-shell-main">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileTopbar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0B0B0B]/95 px-3 backdrop-blur lg:hidden" data-testid="admin-shell-topbar">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={onOpen}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white transition hover:border-[#C9A84C]/30"
        data-testid="admin-shell-menu-button"
      >
        <Menu size={20} />
      </button>
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">DGN</p>
        <p className="-mt-0.5 text-sm font-semibold text-white">Admin</p>
      </div>
      <div className="w-11" aria-hidden="true" />
    </header>
  );
}

function ShellBrand() {
  return (
    <div className="mb-6 hidden lg:block">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">DGN</p>
      <p className="mt-1 text-lg font-semibold text-white">Admin</p>
    </div>
  );
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        Principal
      </p>
      <nav className="flex flex-col gap-1" data-testid="admin-shell-nav">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = isRouteActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                active
                  ? "bg-[#C9A84C]/12 text-[#E7C96A]"
                  : "text-[#D1D5DB] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-[#C9A84C]" : "text-white/50"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Sistema
        </p>
        <form action="/admin/growth/logout" method="post" className="w-full">
          <button
            type="submit"
            className="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#8A8A8A] transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} className="text-white/50" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </div>
  );
}
