import type { Metadata } from "next";
import { ReconcilerClient } from "./ReconcilerClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reconciliar assinantes" };

export default function ReconcileSubscribersPage() {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Central operacional · Fase 1 (preview)
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Reconciliar assinantes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Compare um relatório operacional com a base canônica antes de atualizar qualquer
            assinatura. Nada é escrito enquanto você não confirmar cada linha individualmente.
          </p>
        </header>

        <ReconcilerClient />

        <p className="mt-8 text-[11px] text-white/40">
          O apply é executado pelo servidor: cada linha é revalidada contra o snapshot canônico
          imediatamente antes do write, e nenhuma cobrança PagBank é modificada.
        </p>
      </div>
    </div>
  );
}
