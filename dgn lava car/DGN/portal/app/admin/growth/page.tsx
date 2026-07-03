import Link from "next/link";
import { ArrowRight, Brain, Crown, ShieldAlert, Sparkles, UserCheck } from "lucide-react";

const modules = [
  {
    href: "/admin/growth/intelligence",
    eyebrow: "Base e score",
    title: "DGN Intelligence",
    text: "Importe, visualize, filtre e priorize clientes pela base DGN Intelligence 3.0.",
    icon: Brain,
  },
  {
    href: "/admin/growth/curadoria",
    eyebrow: "Conhecimento humano",
    title: "Curadoria DGN",
    text: "Transforme leitura comercial do Rodrigo em dados estruturados para relacionamento.",
    icon: UserCheck,
  },
  {
    href: "/admin/growth/founders-2026",
    eyebrow: "Campanha ativa",
    title: "Founders 2026",
    text: "Gerencie os 30 convites, WhatsApp manual assistido, status e conversao.",
    icon: Crown,
  },
];

export default function DgnGrowthPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.08] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            DGN Growth
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
            Intelligence, curadoria e campanha Founders em uma mesa interna.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            MVP operacional para organizar a base inicial, selecionar os primeiros 30 Founders e
            conduzir convites de forma manual assistida.
          </p>
        </header>

        <section className="mt-6 rounded-lg border border-[#C9A84C]/18 bg-[#111111] p-4">
          <div className="flex gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#C9A84C]" />
            <div>
              <p className="text-sm font-semibold text-white">Area interna</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
                Proteger esta area com autenticacao/admin antes de operar com dados reais em
                producao. Esta versao nao cria ERP, CRM completo, disparo em massa ou WhatsApp API.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-lg border border-[#C9A84C]/18 bg-[#101010] p-6 transition hover:border-[#C9A84C]/42"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                    <Icon size={22} />
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-[#C9A84C] transition group-hover:translate-x-1"
                  />
                </div>
                <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
                  {module.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">{module.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#A7A7A7]">{module.text}</p>
              </Link>
            );
          })}
        </section>

        <section className="mt-5 rounded-lg border border-white/[0.08] bg-[#101010] p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-[#C9A84C]" />
            <p className="text-sm leading-relaxed text-[#A7A7A7]">
              Estrutura conceitual preparada para campanhas futuras: Founder, Smart, Priority,
              Renovacao, Reativacao, Corporate Care e Indicacao. Nesta entrega, somente Founders
              2026 esta operacional.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
