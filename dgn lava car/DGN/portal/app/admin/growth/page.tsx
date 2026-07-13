import Link from "next/link";
import { ArrowRight, Brain, Crown, ShieldCheck, UserCheck } from "lucide-react";

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
    text: "Transforme a leitura comercial em dados estruturados de relacionamento.",
    icon: UserCheck,
  },
  {
    href: "/admin/growth/founders-2026",
    eyebrow: "Campanha ativa",
    title: "Founders 2026",
    text: "Acompanhe os 30 convites, mensagens manuais, status e conversões.",
    icon: Crown,
  },
  {
    href: "/admin/growth/assinantes-detectados",
    eyebrow: "Fila operacional",
    title: "Assinantes detectados",
    text: "Assinantes com evidência 4uCar aguardando validação humana — fora da fila de aquisição.",
    icon: ShieldCheck,
  },
];

export default function DgnGrowthPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            DGN Growth
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Central de relacionamento e curadoria.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            Intelligence, curadoria e campanhas em uma única mesa de operação.
          </p>
        </header>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-2xl border border-white/[0.06] bg-[#101010] p-6 transition hover:border-[#C9A84C]/40"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                    <Icon size={22} />
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-[#C9A84C]/70 transition group-hover:translate-x-1 group-hover:text-[#C9A84C]"
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
      </div>
    </main>
  );
}
