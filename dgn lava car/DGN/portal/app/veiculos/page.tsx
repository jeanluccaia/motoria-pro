import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber } from "@/lib/portal/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Veículos — DGN Club" };

export default async function VeiculosPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/veiculos");

  const firstName = subscriber.customer?.first_name ?? "assinante";

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="veiculos">
      <h1 className="text-2xl font-semibold">Seus veículos</h1>
      <p className="mt-1 text-sm text-white/60">
        Veículos vinculados à sua assinatura. Alterações são feitas em contato
        direto com a equipe DGN.
      </p>

      {subscriber.vehicles.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
          Nenhum veículo cadastrado. Entre em contato para vincular seus veículos.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {subscriber.vehicles.map((v) => (
            <li
              key={v.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium">
                    {v.model ?? "Modelo em validação"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    Placa {v.masked_plate ?? v.plate ?? "—"}
                  </p>
                  {v.brand && (
                    <p className="mt-1 text-xs text-white/50">{v.brand}</p>
                  )}
                </div>
                {v.is_primary && (
                  <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
                    principal
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
