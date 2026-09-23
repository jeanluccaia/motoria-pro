import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DiagnosticPreviewMobile } from "@/components/growth/diagnostics/DiagnosticPreviewMobile";
import { DEMO_DIAGNOSTIC_DRAFT } from "@/lib/growth/diagnostics/fixtures";

export const dynamic = "force-dynamic";

// Preview interno (admin-only). Dados fictícios estáticos —
// nunca busca do banco, nunca gera token, nunca faz tracking.
export default function DiagnosticPreviewPage() {
  return (
    <div className="min-h-dvh bg-[#050505] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/growth/diagnosticos"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-[#E7C96A]"
        >
          <ArrowLeft size={12} />
          Diagnósticos
        </Link>

        <header className="mt-4 flex flex-col gap-2 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
              Preview mobile · admin-only
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Como o cliente veria a página
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Máximo 380px, mobile-first, sem scroll horizontal. Foto marcada como
              interna não aparece; nota DGN parcial exibe "Sem avaliação registrada"
              sem virar 0,0.
            </p>
          </div>
          <span className="inline-flex h-fit items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            Fixture demo · sem token
          </span>
        </header>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
          <DiagnosticPreviewMobile draft={DEMO_DIAGNOSTIC_DRAFT} />
          <aside className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 text-sm text-white/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
              O que testar aqui
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
              <li>
                <strong className="text-white">Hero ilustrativo</strong> — o card
                superior mostra a etiqueta "Ilustração conceitual · não é foto do
                seu carro". Nenhuma foto real do cliente é carregada.
              </li>
              <li>
                <strong className="text-white">Avaliação parcial</strong> — 4 de 5
                critérios estão preenchidos. Média 5,8. Um critério ("Ausência de
                riscos e marcas") aparece como "Não avaliado" — nunca vira 0,0.
              </li>
              <li>
                <strong className="text-white">Pontos encontrados</strong> — ordenado
                por severidade. A área <em>Interior</em> está marcada como não
                pública e a foto interna dela não aparece.
              </li>
              <li>
                <strong className="text-white">Investimento</strong> — desconto de
                20% aparece como tarja riscada; total soma R$ 760,00.
              </li>
              <li>
                <strong className="text-white">CTAs</strong> — botão WhatsApp está
                desabilitado. Página pública real chega na Entrega 2 (link opaco,
                expiração, revogação, tracking).
              </li>
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
}
