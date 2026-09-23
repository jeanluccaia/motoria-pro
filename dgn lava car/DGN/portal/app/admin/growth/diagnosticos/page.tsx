import Link from "next/link";
import { Stethoscope, Smartphone, PenLine, Beaker, Sparkles } from "lucide-react";
import { NewDiagnosticButton } from "@/components/growth/diagnostics/NewDiagnosticButton";
import { isDiagnosticHomologFixtureVisible } from "@/lib/growth/diagnostics/fixture-guard";

// DGN Diagnósticos — landing.
//   * Fluxo real "Novo diagnóstico" = /novo (busca customer + veículo).
//   * Preview mobile = /preview (mock cliente).
//   * Formulário mock/preview = /novo-preview (fixture em memória, dev-only).
//   * Botão fixture pra homologação = mostrado APENAS quando
//     NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE=1|true|yes. Nunca em prod.

export const dynamic = "force-dynamic";

const HOMOLOG_FIXTURE_VISIBLE = isDiagnosticHomologFixtureVisible(process.env as Record<string, string | undefined>);

export default function DiagnosticosLandingPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/[0.06] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Central operacional
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            <Stethoscope size={26} className="text-[#E7C96A]" />
            Diagnósticos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            Fluxo real de rascunho persistido no banco. Publicação, link opaco,
            página pública e tracking chegam na Entrega 2.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/growth/diagnosticos/novo"
            className="group rounded-2xl border border-[#C9A84C]/35 bg-[#C9A84C]/[0.05] p-6 transition hover:border-[#C9A84C]/60"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/12 text-[#E7C96A]">
                <Sparkles size={16} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Novo diagnóstico
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Buscar cliente existente → escolher veículo → criar rascunho.
                  Sem cadastro novo, sem fixture. Autosave server + retomada.
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7C96A] transition group-hover:tracking-[0.24em]">
                  Começar →
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/growth/diagnosticos/preview"
            className="group rounded-2xl border border-white/[0.06] bg-[#101010] p-6 transition hover:border-[#C9A84C]/35"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#E7C96A]">
                <Smartphone size={16} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Preview mobile (cliente)
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Como o cliente veria a página web compartilhável. Fixture
                  ilustrativa; sem PDF, sem A4.
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7C96A] transition group-hover:tracking-[0.24em]">
                  Ver preview →
                </p>
              </div>
            </div>
          </Link>
        </section>

        <section className="mt-6">
          <Link
            href="/admin/growth/diagnosticos/novo-preview"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-semibold text-white/60 hover:border-white/20"
          >
            <PenLine size={12} />
            Formulário mock (fixture em memória — só pra referência UX)
          </Link>
        </section>

        {HOMOLOG_FIXTURE_VISIBLE ? (
          <section className="mt-8 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.03] p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-200">
                <Beaker size={16} />
              </span>
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  HOMOLOGAÇÃO · fixture ativa (env NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE=1)
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Atalho fixture (branch Supabase)
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Não aparece em Production (env não é setada). Só serve pra
                  criar rascunho contra TEST Customer da branch sem passar pela
                  busca — pra smoke rápido durante homologação.
                </p>
                <div className="mt-4">
                  <NewDiagnosticButton
                    customerId="11111111-1111-1111-1111-111111111111"
                    vehicleId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
                    catalogVersion="diag-v1-2026-09"
                    performedBy="Homologação Entrega 1"
                    label="Criar rascunho fixture (TEST A + HB20)"
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <footer className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.03] p-5 text-xs leading-relaxed text-amber-100/80">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Escopo desta entrega
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-amber-100/70">
            <li>Rascunho real grava em <span className="font-mono">crm_diagnostics</span> via RPCs SECURITY DEFINER.</li>
            <li>Autosave server + optimistic locking + Idempotency-Key + recuperação de buffer local.</li>
            <li>Rota pública, versão imutável, snapshot e tracking ficam pra Entrega 2.</li>
            <li>Preços de referência não são definitivos — o Digo valida antes de qualquer publicação real.</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
