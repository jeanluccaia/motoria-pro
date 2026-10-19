"use client";

import { usePresentation } from "./PresentationProvider";
import { PLAN_CATALOG } from "@/lib/data";
import { IconArrow, IconCalendar, IconSpark, IconTrend, IconUsers } from "@/components/Icons";

/**
 * Cena 6 — simulação visual de SaaS replicável.
 *
 * Mostra uma SEGUNDA marca fictícia com paleta/logo próprios, usando a mesma
 * arquitetura visual do Command Center. Identificada no topo como
 * "Simulação visual · nova marca fictícia" para não insinuar infraestrutura
 * multi-tenant em produção.
 *
 * Overlay full-screen sobre a Visão Geral, abaixo do painel narrativo.
 */
export function BrandSkinOverlay() {
  const { active, skinOverride } = usePresentation();
  if (!active || skinOverride !== "second-brand") return null;

  // Breakdown fictício plausível pra uma 2ª unidade pequena
  const subs = 18;
  const essential = 8;
  const smart = 7;
  const priority = 3;
  const mrr =
    essential * PLAN_CATALOG.essential.priceMonthly +
    smart * PLAN_CATALOG.smart.priceMonthly +
    priority * PLAN_CATALOG.priority.priceMonthly;
  const mrrDisplay = `R$ ${(mrr / 1000).toFixed(1).replace(".", ",")}k`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950">
      {/* Banner "simulação visual" */}
      <div className="sticky top-0 z-[55] bg-gradient-to-r from-teal-500/15 via-teal-500/10 to-transparent border-b border-teal-400/20 backdrop-blur-md">
        <div className="px-6 lg:px-10 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="pill bg-teal-400/15 text-teal-200 border border-teal-400/30">
            Simulação visual · nova marca fictícia
          </span>
          <p className="text-xs text-ink-200">
            Mesma plataforma, outra identidade — configuração, não re-engenharia
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 lg:py-8 space-y-8 pb-[280px] lg:pb-[200px]">
        {/* Hero da 2ª marca */}
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2.5">
              {/* Logo tipográfico fictício */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-ink-950 font-bold text-sm tracking-tight">
                  ND
                </span>
              </div>
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wider text-teal-300">
                  Northside Detailing
                </p>
                <p className="text-sm text-ink-200">
                  Boutique de detalhamento · Pinheiros
                </p>
              </div>
            </div>
            <h1 className="mt-5 text-[32px] lg:text-[40px] font-semibold tracking-tight text-white leading-[1.1]">
              Bom dia, Rafa
            </h1>
            <p className="mt-3 text-ink-100 text-[16px]">
              3 atendimentos hoje · 1 em andamento · 2 oportunidades priorizadas
            </p>
          </div>
        </section>

        {/* Próxima ação da 2ª marca */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 surface-raised p-6 lg:p-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/[0.07] via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="inline-flex items-center gap-2 pill bg-teal-400/10 text-teal-300 border border-teal-400/20">
                  <IconSpark size={12} />
                  Próxima ação recomendada
                </div>
                <span className="text-[11px] uppercase tracking-wider text-ink-300">
                  Prioridade alta
                </span>
              </div>

              <h2 className="mt-4 text-2xl lg:text-[26px] text-white font-semibold leading-tight tracking-tight max-w-2xl">
                Oferecer plano Boutique para Julia antes da próxima troca de pneu
              </h2>

              <div className="mt-4 flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ink-700 to-ink-850 border border-white/10 flex items-center justify-center text-sm font-semibold text-ink-100">
                    JV
                  </div>
                  <div className="leading-tight">
                    <p className="text-[15px] text-white font-medium">Julia Vaz</p>
                    <p className="text-xs text-ink-300">
                      Cliente desde 2024 · perfil detalhista
                    </p>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/5 hidden sm:block" />

                <div className="leading-tight">
                  <p className="text-[11px] uppercase tracking-wider text-ink-300">
                    Argumento
                  </p>
                  <p className="text-sm text-teal-300 font-semibold">
                    Previsibilidade + revisão interna trimestral inclusa
                  </p>
                </div>

                <div className="flex-1" />

                <span className="btn-primary opacity-80 pointer-events-none">
                  Abrir cliente 360° <IconArrow size={14} />
                </span>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 surface-raised p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Operação agora</h3>
              <span className="pill bg-teal-400/10 text-teal-200 border border-teal-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                Ao vivo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Em atendimento", value: 1 },
                { label: "Aguardando", value: 1 },
                { label: "Agendados", value: 1 },
                { label: "Concluídos", value: 0 },
              ].map((k) => (
                <div
                  key={k.label}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <p className="text-[26px] leading-none font-semibold text-white tabular-nums">
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-300">
                    {k.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiTeal
            label="Assinantes ativos"
            value={subs}
            delta="+2 esta semana"
            icon={<IconUsers />}
            badge="contexto demo"
          />
          <KpiTeal
            label="Oportunidades"
            value={5}
            delta="2 novas · 3 upsells"
            icon={<IconSpark />}
          />
          <KpiTeal
            label="Atendimentos hoje"
            value={3}
            delta="1 em andamento"
            icon={<IconCalendar />}
          />
          <KpiTeal
            label="Receita recorrente"
            value={mrrDisplay}
            delta={`+ R$ ${(2 * PLAN_CATALOG.essential.priceMonthly).toLocaleString("pt-BR")} vs. set`}
            icon={<IconTrend />}
            badge="contexto demo"
          />
        </section>

        {/* Mensagem explicativa */}
        <section className="surface p-6 lg:p-7 flex items-start gap-4">
          <span className="w-10 h-10 rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-300 flex items-center justify-center shrink-0">
            <IconSpark size={16} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Mesmas regras, outra marca
            </h3>
            <p className="mt-1 text-sm text-ink-200 max-w-3xl leading-relaxed">
              Nome, logo, paleta, catálogo de planos e perfis de cliente são
              configuráveis. A inteligência comercial, a jornada 360°, as
              oportunidades priorizadas e o Modo Apresentação permanecem — porque
              são parte do produto, não do skin. Esta tela é uma simulação visual
              demonstrativa — a infraestrutura multi-tenant real está prevista
              para a próxima fase.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiTeal({
  label,
  value,
  delta,
  icon,
  badge,
}: {
  label: string;
  value: string | number;
  delta: string;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="surface-raised p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium">
              {label}
            </span>
            {badge && (
              <span className="pill bg-white/5 text-ink-400 border border-white/10 normal-case tracking-normal text-[9px] py-0.5 px-1.5">
                {badge}
              </span>
            )}
          </div>
          <span className="mt-1 text-[26px] leading-none font-semibold text-white tabular-nums tracking-tight">
            {value}
          </span>
        </div>
        {icon && (
          <div className="w-8 h-8 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-ink-300 shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="pill bg-teal-400/10 text-teal-200 border border-teal-400/20">
          {delta}
        </span>
      </div>
    </div>
  );
}
