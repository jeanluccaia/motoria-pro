import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber, primarySubscription } from "@/lib/portal/loader";
import { planFor } from "@/lib/portal/plan-catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Benefícios — DGN Club" };

// Catálogo canônico dos benefícios por plano. Sem "Elite", sem "Premium".
const BENEFITS = {
  Essential: {
    washes: "1 lavagem/mês",
    esteticaDiscount: "7% OFF na Estética DGN",
    priority: "Atendimento padrão",
  },
  Smart: {
    washes: "2 lavagens/mês",
    esteticaDiscount: "15% OFF na Estética DGN",
    priority: "Atendimento com prioridade média",
  },
  Priority: {
    washes: "4 lavagens/mês",
    esteticaDiscount: "20% OFF na Estética DGN",
    priority: "Máxima prioridade logística",
  },
} as const;

export default async function BeneficiosPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/beneficios");
  if (subscriber.status === "beta_gate_closed") redirect("/entrar?next=/beneficios&beta=closed");

  const firstName = subscriber.customer?.first_name ?? "assinante";
  const primary = primarySubscription(subscriber.subscriptions);
  const plan = planFor(primary?.plan ?? null);
  const benefits = plan ? BENEFITS[plan.code] : null;

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="beneficios">
      <h1 className="text-2xl font-semibold">Benefícios</h1>
      <p className="mt-1 text-sm text-white/60">
        Vantagens exclusivas dos assinantes DGN Club.
      </p>

      {plan && benefits ? (
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
            Seu plano
          </p>
          <h2 className={`mt-1 text-xl font-semibold ${plan.colorClass}`}>
            {plan.fullLabel}
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            <li>· {benefits.washes}</li>
            <li>· {benefits.esteticaDiscount}</li>
            <li>· {benefits.priority}</li>
            <li>
              · Leva &amp; Traz: disponível conforme rota, região e
              disponibilidade{plan.code === "Priority" ? " (prioridade máxima)" : ""}.
            </li>
          </ul>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.05] p-5 text-sm text-amber-100">
          <p className="font-medium">Assinatura em validação.</p>
          <p className="mt-1 text-amber-100/80">
            Assim que a curadoria confirmar seu plano, os benefícios aparecem aqui.
          </p>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
          Todos os planos DGN Club
        </p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-white/50">
              <th className="pb-2">Plano</th>
              <th className="pb-2">Lavagens/mês</th>
              <th className="pb-2">Estética</th>
            </tr>
          </thead>
          <tbody className="text-white/85">
            <tr>
              <td className="py-1.5 text-emerald-300">Essential</td>
              <td className="py-1.5">1</td>
              <td className="py-1.5">7% OFF</td>
            </tr>
            <tr>
              <td className="py-1.5 text-cyan-300">Smart</td>
              <td className="py-1.5">2</td>
              <td className="py-1.5">15% OFF</td>
            </tr>
            <tr>
              <td className="py-1.5 text-amber-300">Priority</td>
              <td className="py-1.5">4</td>
              <td className="py-1.5">20% OFF</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-white/40">
          Atendimentos operacionais e Leva &amp; Traz seguem a disponibilidade
          logística da unidade DGN.
        </p>
      </section>
    </PortalShell>
  );
}
