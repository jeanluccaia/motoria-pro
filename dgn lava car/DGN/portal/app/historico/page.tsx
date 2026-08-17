import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber } from "@/lib/portal/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Histórico — DGN Club" };

export default async function HistoricoPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/historico");

  const firstName = subscriber.customer?.first_name ?? "assinante";

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="historico">
      <h1 className="text-2xl font-semibold">Histórico</h1>
      <p className="mt-1 text-sm text-white/60">
        Seu histórico completo de atendimentos aparece aqui assim que a
        sincronização com a 4uCar for concluída.
      </p>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
        <p className="font-medium text-white/85">
          Histórico completo em sincronização.
        </p>
        <p className="mt-2 text-white/60">
          Os atendimentos operacionais da 4uCar serão exibidos aqui em breve.
          Enquanto isso, nenhum atendimento fictício é apresentado.
        </p>
      </section>
    </PortalShell>
  );
}
