import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import {
  formatDueDate,
  loadCurrentSubscriber,
  paymentDisplayLabel,
} from "@/lib/portal/loader";
import { planFor } from "@/lib/portal/plan-catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plano — DGN Club" };

export default async function PlanoPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/plano");

  const firstName = subscriber.customer?.first_name ?? "assinante";
  const plan = planFor(subscriber.subscription?.plan ?? null);
  const sub = subscriber.subscription;

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="plano">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Assinatura atual</p>
        <h1 className={`mt-2 text-3xl font-semibold ${plan?.colorClass ?? "text-white"}`}>
          {plan?.fullLabel ?? "Assinatura em validação"}
        </h1>
        {plan && (
          <p className="mt-1 text-sm text-white/70">{plan.frequencyLabel}</p>
        )}
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Situação financeira
          </p>
          <p className="mt-2 text-lg text-white/90">{paymentDisplayLabel(sub)}</p>
          {sub?.payment_method_label && (
            <p className="mt-1 text-xs text-white/60">
              Método informado: {sub.payment_method_label}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Próximo vencimento
          </p>
          <p className="mt-2 text-lg text-white/90">{formatDueDate(sub)}</p>
          {sub?.billing_due_source && (
            <p className="mt-1 text-[11px] text-white/50">
              Origem: {sub.billing_due_source}
            </p>
          )}
        </div>
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-white/40">
        Os planos DGN Club são: Essential (1 lavagem/mês), Smart (2/mês) e
        Priority (4/mês). Alterações de plano seguem em contato direto com
        a equipe DGN. Nenhum ajuste financeiro é processado por este Portal.
      </p>
    </PortalShell>
  );
}
