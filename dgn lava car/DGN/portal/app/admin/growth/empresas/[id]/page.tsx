import Link from "next/link";
import { notFound } from "next/navigation";
import {
  listCompanies,
  listFleetVehiclesByCompany,
  listManagersByCompany,
  listServiceRequests,
  type CompanyRow,
  type FleetVehicleRow,
  type ManagerRow,
  type ServiceRequestRow,
} from "@/lib/growth/db/corporate-fleet-write";
import { CompanyDetail } from "@/components/growth/CompanyDetail";
import { AlertTriangle } from "lucide-react";
import { buildManagerCookieValue } from "@/lib/growth/db/corporate-fleet-route";

export const dynamic = "force-dynamic";

type State =
  | {
      kind: "ok";
      company: CompanyRow;
      managers: ManagerRow[];
      managerLinks: Record<string, string>;
      vehicles: FleetVehicleRow[];
      requests: ServiceRequestRow[];
    }
  | { kind: "error"; message: string }
  | { kind: "not-found" };

async function loadState(companyId: string): Promise<State> {
  try {
    const companies = await listCompanies();
    const company = companies.find((c) => c.id === companyId);
    if (!company) return { kind: "not-found" };
    const [managers, vehicles, requests] = await Promise.all([
      listManagersByCompany(companyId),
      listFleetVehiclesByCompany(companyId),
      listServiceRequests({ companyId, limit: 200 }),
    ]);
    const managerLinks: Record<string, string> = {};
    for (const m of managers) {
      try {
        // Guarda só o HMAC puro (CompanyDetail monta a URL completa).
        managerLinks[m.id] = buildManagerCookieValue(m.id).split(".")[1] ?? "";
      } catch {
        // DGN_MANAGER_SIGNING_SECRET não configurado — gestor não terá link.
      }
    }
    return { kind: "ok", company, managers, managerLinks, vehicles, requests };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await loadState(id);
  if (state.kind === "not-found") notFound();

  return (
    <div className="dgn-page">
      <div>
        <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Gestão de frotas
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {state.kind === "ok" ? state.company.displayName : "Empresa"}
            </h1>
            {state.kind === "ok" ? (
              <p className="mt-1 text-sm text-white/55">
                {state.company.legalName}
                {state.company.cnpj ? ` · CNPJ ${state.company.cnpj}` : ""}
              </p>
            ) : null}
          </div>
          <Link
            href="/admin/growth/empresas"
            className="inline-flex min-h-11 items-center self-start rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            Voltar
          </Link>
        </header>

        {state.kind === "error" ? (
          <section className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Falha ao carregar
              </p>
              <p className="mt-1 leading-relaxed">Não foi possível carregar a empresa. Tente novamente mais tarde.</p>
            </div>
          </section>
        ) : (
          <CompanyDetail
            company={state.company}
            managers={state.managers}
            managerLinks={state.managerLinks}
            vehicles={state.vehicles}
            requests={state.requests}
          />
        )}
      </div>
    </div>
  );
}
