import Link from "next/link";
import { Stethoscope, Smartphone, PenLine, Beaker } from "lucide-react";
import { NewDiagnosticButton } from "@/components/growth/diagnostics/NewDiagnosticButton";

// DGN Diagnósticos — landing da Fase 0.5 (dev-only)
// Não expõe fluxo de publicação nem rota pública. Só serve como
// portal de entrada pras duas telas do preview interno.

export const dynamic = "force-dynamic";

export default function DiagnosticosLandingPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/[0.06] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Central operacional · em desenho
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            <Stethoscope size={26} className="text-[#E7C96A]" />
            Diagnósticos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            Fase 0.5 — preview de UX. As duas telas abaixo já estão navegáveis
            com dados fictícios. Nada bate em Supabase. Nada é publicado. A rota
            pública, o link opaco, o tracking e a versão imutável entram na
            Entrega 2, depois do OK do Digo/Jean sobre a UX.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/growth/diagnosticos/novo"
            className="group rounded-2xl border border-white/[0.06] bg-[#101010] p-6 transition hover:border-[#C9A84C]/35"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#E7C96A]">
                <PenLine size={16} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Formulário admin
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  6 seções: identificação, inspeção visual (9 áreas), 5
                  critérios DGN, diagnóstico, investimento opcional e revisão.
                  Autosave localStorage a cada 3s de ociosidade.
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7C96A] transition group-hover:tracking-[0.24em]">
                  Abrir formulário →
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
                  Como o cliente veria a página web compartilhável: hero
                  ilustrativo, nota DGN, pontos encontrados, recomendação,
                  investimento e próximo passo. Sem PDF, sem A4.
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7C96A] transition group-hover:tracking-[0.24em]">
                  Ver preview →
                </p>
              </div>
            </div>
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.03] p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-200">
              <Beaker size={16} />
            </span>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Entrega 1 · homologação em Supabase branch
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Criar rascunho real (persiste no banco)
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Botão abaixo chama <span className="font-mono text-white/80">POST /api/admin/growth/customers/[id]/diagnostics</span> com
                Idempotency-Key único. Redireciona pra editor real com autosave
                server + retomada real via GET. Usa cliente/veículo de teste da
                branch. NÃO usar em prod até homologação completa.
              </p>
              <div className="mt-4">
                <NewDiagnosticButton
                  customerId="11111111-1111-1111-1111-111111111111"
                  vehicleId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
                  catalogVersion="diag-v1-2026-09"
                  performedBy="Homologação Entrega 1"
                  label="Criar rascunho real (TEST Customer A + HB20)"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.03] p-5 text-xs leading-relaxed text-amber-100/80">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Escopo desta fase
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-amber-100/70">
            <li>Form mock/preview continua com fixtures em memória (localStorage-only).</li>
            <li>Rascunho real (botão acima) grava em <span className="font-mono">crm_diagnostics</span> via RPCs canônicas.</li>
            <li>Rota pública, versão imutável, snapshot e tracking ficam pra Entrega 2.</li>
            <li>Preços de referência não são definitivos — o Digo valida antes de qualquer publicação real.</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
