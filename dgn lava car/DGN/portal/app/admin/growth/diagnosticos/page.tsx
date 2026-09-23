import Link from "next/link";
import { Stethoscope, Smartphone, PenLine } from "lucide-react";

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

        <footer className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/[0.03] p-5 text-xs leading-relaxed text-amber-100/80">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Escopo desta fase
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-amber-100/70">
            <li>Sem migration, RPC, bucket ou endpoint público.</li>
            <li>Sem Supabase, sem tracking, sem eventos.</li>
            <li>Dados fictícios (cliente com 2 veículos, avaliação parcial, foto interna).</li>
            <li>
              Preços de referência não são definitivos — o Digo valida antes de
              qualquer publicação real.
            </li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
