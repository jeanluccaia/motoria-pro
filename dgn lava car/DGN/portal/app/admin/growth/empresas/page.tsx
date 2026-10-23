import Link from "next/link";
import {
  listCompanies,
  listServiceRequests,
  type CompanyRow,
  type ServiceRequestRow,
} from "@/lib/growth/db/corporate-fleet-write";
import { CompaniesAdmin } from "@/components/growth/CompaniesAdmin";
import { AlertTriangle, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

type State =
  | { kind: "ok"; companies: CompanyRow[]; pendingByCompany: Record<string, number> }
  | { kind: "error"; message: string };

async function loadState(): Promise<State> {
  try {
    const [companies, pendingRequests] = await Promise.all([
      listCompanies(),
      listServiceRequests({ status: ["pending", "counter_proposed"], limit: 500 }),
    ]);
    const pendingByCompany: Record<string, number> = {};
    for (const r of pendingRequests) {
      pendingByCompany[r.companyId] = (pendingByCompany[r.companyId] ?? 0) + 1;
    }
    return { kind: "ok", companies, pendingByCompany };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

export default async function EmpresasAdminPage() {
  const state = await loadState();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Frotas B2B
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Empresas contratantes
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Clientes corporativos com frota, gestores e solicitações de serviço.
              Cada gestor acessa o portal da empresa pelo link assinado — zero acesso ao
              CRM interno.
            </p>
          </div>
          <Link
            href="/admin/growth"
            className="inline-flex min-h-11 items-center self-start rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            Voltar ao Dashboard
          </Link>
        </header>

        {state.kind === "error" ? (
          <section className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Frotas B2B indisponível
              </p>
              <p className="mt-1 leading-relaxed">
                {state.message}
              </p>
            </div>
          </section>
        ) : state.companies.length === 0 ? (
          <section className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-white/80">
              <Building2 size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Nenhuma empresa ainda</h2>
              <p className="mt-1 text-sm text-white/60">
                Comece cadastrando a primeira empresa contratante.
              </p>
            </div>
            <CompaniesAdmin companies={[]} pendingByCompany={{}} />
          </section>
        ) : (
          <CompaniesAdmin companies={state.companies} pendingByCompany={state.pendingByCompany} />
        )}
      </div>
    </div>
  );
}

export type { ServiceRequestRow };
