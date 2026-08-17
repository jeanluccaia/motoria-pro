import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "../_components/portal-shell";
import {
  balanceDisplay,
  formatDueDate,
  loadCurrentSubscriber,
  nextServiceDisplay,
  paymentDisplayLabel,
} from "@/lib/portal/loader";
import { planFor } from "@/lib/portal/plan-catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel — DGN Club" };

export default async function DashboardPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/dashboard");

  const firstName = subscriber.customer?.first_name ?? "assinante";
  const plan = planFor(subscriber.subscription?.plan ?? null);
  const vehicleCount = subscriber.vehicles.length;
  const primaryVehicle = subscriber.vehicles.find((v) => v.is_primary) ?? subscriber.vehicles[0];

  return (
    <PortalShell
      firstName={firstName}
      founderBadge={subscriber.founder?.number ?? null}
      active="dashboard"
    >
      {subscriber.status === "no_link" && (
        <section className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 text-sm text-amber-100">
          <p className="font-semibold">Sua conta ainda não está vinculada a uma assinatura.</p>
          <p className="mt-2 text-amber-100/80">
            Fale com a equipe DGN Club para ativar o acesso ao seu Portal.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Seu plano</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <h2 className={`text-2xl font-semibold ${plan?.colorClass ?? "text-white"}`}>
            {plan?.fullLabel ?? "Assinatura em validação"}
          </h2>
          {plan && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
              {plan.frequencyLabel}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-white/70">
          Status: <span className="text-white/90">{paymentDisplayLabel(subscriber.subscription)}</span>
        </p>
        <p className="mt-1 text-sm text-white/70">
          Próximo vencimento: <span className="text-white/90">{formatDueDate(subscriber.subscription)}</span>
        </p>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Saldo do ciclo
          </p>
          <p className="mt-2 text-lg font-medium text-white/90">{balanceDisplay()}</p>
          <p className="mt-1 text-xs text-white/50">
            Sincronização com atendimentos da 4uCar em preparação.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Próximo atendimento
          </p>
          <p className="mt-2 text-lg font-medium text-white/90">
            {nextServiceDisplay(subscriber.subscription)}
          </p>
          <Link
            href="/agendar"
            className="mt-3 inline-flex items-center rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:text-white"
          >
            Agendar atendimento
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Seus veículos
          </p>
          <Link href="/veiculos" className="text-[11px] text-white/60 hover:text-white">
            Ver todos ({vehicleCount})
          </Link>
        </div>
        {primaryVehicle ? (
          <div className="mt-3">
            <p className="text-lg font-medium">{primaryVehicle.model ?? "Modelo em validação"}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">
              Placa {primaryVehicle.masked_plate ?? primaryVehicle.plate ?? "não cadastrada"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/60">Nenhum veículo cadastrado.</p>
        )}
      </section>
    </PortalShell>
  );
}
