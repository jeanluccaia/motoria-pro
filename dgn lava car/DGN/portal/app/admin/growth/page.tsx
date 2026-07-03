import Link from "next/link";
import { ArrowRight, Crown, ShieldAlert, Sparkles } from "lucide-react";

export default function DgnGrowthPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.08] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            DGN Growth
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
            Central interna de campanhas e relacionamento.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            Primeira base operacional do DGN Growth dentro do ecossistema DGN Club.
            Nesta etapa, somente o Campaign Center Founders 2026 está ativo.
          </p>
        </header>

        <section className="mt-6 rounded-lg border border-[#C9A84C]/18 bg-[#111111] p-4">
          <div className="flex gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#C9A84C]" />
            <div>
              <p className="text-sm font-semibold text-white">Rota interna</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
                Proteger esta área com autenticação/admin antes de operar com dados reais em
                produção. Não há CRM, ERP, disparo em massa ou integração externa nesta versão.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Link
            href="/admin/growth/founders-2026"
            className="group rounded-lg border border-[#C9A84C]/24 bg-[linear-gradient(145deg,#17120A_0%,#101010_62%,#0B0B0B_100%)] p-6 transition hover:border-[#C9A84C]/45"
          >
            <div className="flex items-start justify-between gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-[#C9A84C]">
                <Crown size={22} />
              </div>
              <ArrowRight
                size={20}
                className="text-[#C9A84C] transition group-hover:translate-x-1"
              />
            </div>
            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Campanha ativa
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Campaign Center Founders 2026
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#A7A7A7]">
              Acompanhe os 30 convidados Founders, status de convite, links personalizados,
              WhatsApp manual assistido, pagamento e conversão.
            </p>
          </Link>

          <div className="rounded-lg border border-white/[0.08] bg-[#101010] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-[#A7A7A7]">
              <Sparkles size={21} />
            </div>
            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7D7D7D]">
              Base futura
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">DGN Intelligence</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A7A7A7]">
              Nomenclatura preparada para evoluir dados de campanha para customerProfile,
              relationshipScore, recommendedPlan, campaignParticipation e commercialTimeline.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
