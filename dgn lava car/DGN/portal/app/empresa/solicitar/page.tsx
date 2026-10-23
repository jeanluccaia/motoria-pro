import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  DGN_COMPANY_MANAGER_COOKIE,
  verifyManagerCookieValue,
} from "@/lib/growth/db/corporate-fleet-route";
import {
  listCompanies,
  listFleetVehiclesByCompany,
  listManagersByCompany,
  type CompanyRow,
  type FleetVehicleRow,
  type ManagerRow,
} from "@/lib/growth/db/corporate-fleet-write";
import { NewServiceRequestForm } from "@/components/portal/NewServiceRequestForm";

export const dynamic = "force-dynamic";

type State =
  | { kind: "no-session" }
  | {
      kind: "ok";
      company: CompanyRow;
      manager: ManagerRow;
      vehicles: FleetVehicleRow[];
    };

async function loadState(): Promise<State> {
  const jar = await cookies();
  const managerId = verifyManagerCookieValue(jar.get(DGN_COMPANY_MANAGER_COOKIE)?.value);
  if (!managerId) return { kind: "no-session" };

  const companies = await listCompanies();
  for (const c of companies) {
    const managers = await listManagersByCompany(c.id);
    const m = managers.find((x) => x.id === managerId);
    if (m) {
      const vehicles = await listFleetVehiclesByCompany(c.id);
      return { kind: "ok", company: c, manager: m, vehicles };
    }
  }
  return { kind: "no-session" };
}

export default async function EmpresaSolicitarPage() {
  const state = await loadState();
  if (state.kind === "no-session") redirect("/empresa");

  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            {state.company.displayName}
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Nova solicitação de serviço
          </h1>
          <p className="text-sm text-white/60">
            A unidade DGN recebe seu pedido e responde confirmando a data ou propondo uma
            alternativa.
          </p>
          <Link
            href="/empresa"
            className="inline-flex min-h-10 w-fit items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/70 hover:bg-white/[0.08]"
          >
            Voltar
          </Link>
        </header>

        {state.vehicles.length === 0 ? (
          <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-sm text-amber-200/90">
            Sua empresa ainda não cadastrou veículos na frota. Peça para o time DGN cadastrar antes
            de solicitar um serviço.
          </p>
        ) : (
          <NewServiceRequestForm vehicles={state.vehicles} />
        )}
      </div>
    </main>
  );
}
