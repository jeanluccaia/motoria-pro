import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewDiagnosticFlow } from "@/components/growth/diagnostics/NewDiagnosticFlow";
import { loadDiagnosticCustomerCandidates } from "@/lib/growth/diagnostics/load-candidates";
import { GrowthDataError } from "@/components/growth/GrowthDataError";

export const dynamic = "force-dynamic";

// Fluxo REAL "Novo diagnóstico" — Entrega 1.
// Cliente + veículo vêm da base viva (crm_customers, crm_vehicles).
// NÃO há fixture aqui.
export default async function NovoDiagnosticoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialCustomerParam = query.cliente;
  const initialCustomerId = Array.isArray(initialCustomerParam)
    ? initialCustomerParam[0]
    : initialCustomerParam;

  try {
    const candidates = await loadDiagnosticCustomerCandidates();
    return (
      <div className="min-h-dvh bg-[#050505]">
        <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/admin/growth/diagnosticos"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-[#E7C96A]"
            >
              <ArrowLeft size={12} />
              Diagnósticos
            </Link>
          </div>
        </div>
        <NewDiagnosticFlow
          candidates={candidates}
          performedByHint="Curador DGN"
          initialCustomerId={typeof initialCustomerId === "string" ? initialCustomerId : undefined}
        />
      </div>
    );
  } catch (err) {
    return (
      <GrowthDataError message={err instanceof Error ? err.message : "Erro ao carregar clientes."} />
    );
  }
}
