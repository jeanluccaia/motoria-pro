import type { Metadata } from "next";
import { ReconcilerClient } from "./ReconcilerClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reconciliação de assinaturas" };

export default function ReconcileSubscribersPage() {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Sistema · Ferramentas
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Reconciliação de assinaturas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Compare relatórios, identifique divergências e revise as alterações antes de confirmar.
          </p>
        </header>

        <ReconcilerClient />

        <p className="mt-8 text-[11px] text-white/40">
          Somente as linhas selecionadas e confirmadas podem ser atualizadas. Cobranças PagBank permanecem inalteradas.
        </p>
      </div>
    </div>
  );
}
