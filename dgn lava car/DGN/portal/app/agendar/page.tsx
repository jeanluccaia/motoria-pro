import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber } from "@/lib/portal/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendar — DGN Club" };

export default async function AgendarPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/agendar");

  const firstName = subscriber.customer?.first_name ?? "assinante";
  const external = process.env.NEXT_PUBLIC_AGENDA_URL ?? null;

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="agendar">
      <h1 className="text-2xl font-semibold">Agendar atendimento</h1>
      <p className="mt-1 text-sm text-white/60">
        Enquanto a agenda oficial da 4uCar não estiver integrada ao Portal,
        o agendamento acontece pelo canal atual da DGN Club.
      </p>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/80">
        <p className="font-medium text-white/90">Nenhum atendimento futuro sincronizado.</p>
        {external ? (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Abrir agenda
          </a>
        ) : (
          <p className="mt-2 text-white/60">
            Fale com a equipe DGN pelo canal de sempre para reservar seu
            próximo atendimento. A integração automática de agenda está em
            preparação.
          </p>
        )}
      </section>
    </PortalShell>
  );
}
