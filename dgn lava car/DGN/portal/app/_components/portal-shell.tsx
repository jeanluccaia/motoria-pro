import Link from "next/link";

interface Props {
  firstName: string;
  founderBadge?: string | null;
  active: "dashboard" | "plano" | "veiculos" | "historico" | "perfil" | "beneficios" | "agendar";
  children: React.ReactNode;
}

const NAV = [
  { key: "dashboard", label: "Início", href: "/dashboard" },
  { key: "plano", label: "Plano", href: "/plano" },
  { key: "veiculos", label: "Veículos", href: "/veiculos" },
  { key: "historico", label: "Histórico", href: "/historico" },
  { key: "perfil", label: "Perfil", href: "/perfil" },
] as const;

export function PortalShell({ firstName, founderBadge, active, children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">
              DGN Club
            </p>
            <p className="text-sm font-semibold">Olá, {firstName || "assinante"}</p>
          </div>
          <div className="flex items-center gap-2">
            {founderBadge && (
              <span className="rounded-full border border-amber-400/60 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                Founder Nº{founderBadge}
              </span>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/70 transition hover:text-white"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-3 text-xs">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 transition ${
                active === item.key
                  ? "border-white bg-white text-black"
                  : "border-white/15 text-white/70 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}
