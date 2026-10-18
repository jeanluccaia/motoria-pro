"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { usePresentation } from "@/components/presentation/PresentationProvider";

const NAV = [
  { href: "/", label: "Visão Geral", desc: "Command Center" },
  { href: "/clientes/roberta-vinciguerra", label: "Cliente 360°", desc: "Perfil & oportunidades" },
  { href: "#estetica", label: "Evolução Estética", desc: "Em breve", disabled: true },
  { href: "#frotas", label: "Gestão de Frotas", desc: "Em breve", disabled: true },
  { href: "#inteligencia", label: "Inteligência Comercial", desc: "Em breve", disabled: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClient = pathname?.startsWith("/clientes");
  const { start } = usePresentation();

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-ink-900/60 backdrop-blur-sm">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
          <Image
            src="/logo-dgn-clean.png"
            alt="DGN Club"
            width={120}
            height={38}
            priority
            className="h-9 w-auto object-contain"
          />
          <span className="pill bg-white/5 text-ink-300 border border-white/10 ml-auto text-[10px]">
            Vision
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((item) => {
            const active =
              (item.href === "/" && pathname === "/") ||
              (item.href !== "/" && !item.disabled && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                className={clsx(
                  "group flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors",
                  active
                    ? "bg-white/[0.06] border border-white/10"
                    : "hover:bg-white/[0.03] border border-transparent",
                  item.disabled && "opacity-45 pointer-events-none"
                )}
              >
                <div
                  className={clsx(
                    "mt-1 w-1.5 h-1.5 rounded-full",
                    active ? "bg-gold-400" : "bg-ink-500 group-hover:bg-ink-300"
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
                  <span className="text-[11px] text-ink-400 uppercase tracking-wide">
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 m-3 rounded-xl border border-white/5 bg-ink-850/80">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            Operação
          </div>
          <p className="mt-2 text-sm text-ink-100">Unidade Jardins</p>
          <p className="text-xs text-ink-400">Terça · 09:12 · 9 atendimentos</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 border-b border-white/5 bg-ink-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="h-full max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center gap-6">
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/logo-dgn-clean.png"
                alt="DGN Club"
                width={90}
                height={28}
                priority
                className="h-7 w-auto object-contain"
              />
              <span className="pill bg-white/5 text-ink-300 border border-white/10 text-[10px]">
                Vision
              </span>
            </div>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              <Breadcrumb pathname={pathname} />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={start} className="btn-ghost">
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
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-xs font-semibold text-ink-100">
                DG
              </div>
            </div>
          </div>
        </header>

        <div
          className={clsx(
            "flex-1 min-w-0",
            isClient ? "" : "max-w-[1400px] w-full mx-auto"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function Breadcrumb({ pathname }: { pathname: string | null }) {
  if (!pathname || pathname === "/") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-400">DGN Jardins</span>
        <span className="text-ink-600">/</span>
        <span className="text-white font-medium">Visão Geral</span>
      </div>
    );
  }
  if (pathname.startsWith("/clientes")) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-ink-400 hover:text-ink-100">
          DGN Jardins
        </Link>
        <span className="text-ink-600">/</span>
        <span className="text-ink-400">Clientes</span>
        <span className="text-ink-600">/</span>
        <span className="text-white font-medium">Perfil 360°</span>
      </div>
    );
  }
  return null;
}
