import { cookies } from "next/headers";
import Link from "next/link";
import { Building2, LogOut, Plus } from "lucide-react";
import {
  DGN_COMPANY_MANAGER_COOKIE,
  verifyManagerCookieValue,
} from "@/lib/growth/db/corporate-fleet-route";
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
import { ManagerPortal } from "@/components/portal/ManagerPortal";

export const dynamic = "force-dynamic";

type State =
  | { kind: "no-session" }
  | { kind: "stale-manager" }
  | {
      kind: "ok";
      company: CompanyRow;
      manager: ManagerRow;
      vehicles: FleetVehicleRow[];
      requests: ServiceRequestRow[];
    }
  | { kind: "error"; message: string };

async function loadState(): Promise<State> {
  const jar = await cookies();
  const managerId = verifyManagerCookieValue(jar.get(DGN_COMPANY_MANAGER_COOKIE)?.value);
  if (!managerId) return { kind: "no-session" };

  try {
    const companies = await listCompanies();
    let foundCompany: CompanyRow | null = null;
    let foundManager: ManagerRow | null = null;
    for (const c of companies) {
      const managers = await listManagersByCompany(c.id);
      const m = managers.find((x) => x.id === managerId);
      if (m) {
        foundCompany = c;
        foundManager = m;
        break;
      }
    }
    if (!foundCompany || !foundManager) return { kind: "stale-manager" };

    const [vehicles, requests] = await Promise.all([
      listFleetVehiclesByCompany(foundCompany.id),
      listServiceRequests({ companyId: foundCompany.id, limit: 200 }),
    ]);

    return {
      kind: "ok",
      company: foundCompany,
      manager: foundManager,
      vehicles,
      requests,
    };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

export default async function EmpresaPortalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadState();
  const sp = await searchParams;
  const err = typeof sp.err === "string" ? sp.err : null;

  if (state.kind === "no-session" || state.kind === "stale-manager") {
    const [title, message] =
      err === "invalid"
        ? [
            "Link inválido ou expirado",
            "O link que você usou não bateu com a assinatura esperada. Pode ter sido reescrito pelo e-mail/WhatsApp ou revogado. Peça um novo link à equipe DGN.",
          ]
        : err === "missing"
          ? [
              "Link incompleto",
              "Este endereço precisa dos parâmetros de acesso (mgr e t). Peça para a equipe DGN enviar o link completo da sua empresa.",
            ]
          : state.kind === "stale-manager"
            ? [
                "Sessão não encontrada",
                "Seu link é válido, mas o gestor que ele aponta não existe mais no sistema (ou os parâmetros foram adulterados). Peça um link novo à equipe DGN.",
              ]
            : [
                "Acesso restrito",
                "Este portal é exclusivo para gestores de empresas contratantes DGN. Peça para a equipe DGN enviar seu link personalizado — ele traz os parâmetros de autenticação e abre direto na frota da sua empresa.",
              ];
    return (
      <main className="min-h-screen bg-[#0b0b0d] px-4 py-10 text-white sm:py-16">
        <div className="mx-auto flex max-w-md flex-col gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              DGN · Portal do Gestor
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">{title}</h1>
          </div>
          <p className="text-sm leading-relaxed text-white/70">{message}</p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="min-h-screen bg-[#0b0b0d] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.03] p-6">
          <h1 className="text-base font-semibold text-amber-200">Portal indisponível agora</h1>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/80">{state.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/12 text-[#C9A84C]">
              <Building2 size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
                {state.company.displayName}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Olá, {state.manager.displayName.split(" ")[0]}
              </h1>
              <p className="mt-1 text-xs text-white/55">
                Portal exclusivo da sua empresa — você vê só a frota de {state.company.displayName}.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/empresa/solicitar"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] hover:bg-[#C9A84C]/[0.14]"
            >
              <Plus size={14} />
              Nova solicitação
            </Link>
            <form action="/empresa/sair" method="post">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/70 hover:bg-white/[0.08]"
              >
                <LogOut size={14} />
                Sair
              </button>
            </form>
          </div>
        </header>

        <ManagerPortal
          company={state.company}
          manager={state.manager}
          vehicles={state.vehicles}
          requests={state.requests}
        />
      </div>
    </main>
  );
}
