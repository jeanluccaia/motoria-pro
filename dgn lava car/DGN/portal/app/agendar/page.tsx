import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber } from "@/lib/portal/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Solicitar atendimento — DGN Club" };

// WhatsApp oficial DGN — final 6936 (brief P0).
const DGN_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_DGN_WHATSAPP_URL ?? "https://wa.me/551938826936";

export default async function AgendarPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/agendar");
  if (subscriber.status === "beta_gate_closed") redirect("/entrar?next=/agendar&beta=closed");

  const firstName = subscriber.customer?.first_name ?? "assinante";

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="agendar">
      <h1 className="text-2xl font-semibold">Solicitar atendimento</h1>
      <p className="mt-1 text-sm text-white/60">
        A agenda automática da 4uCar está em preparação. Até lá, sua solicitação
        vai direto para o WhatsApp oficial da DGN.
      </p>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/80">
        <p className="font-medium text-white/90">
          Nenhum atendimento futuro sincronizado.
        </p>
        <p className="mt-2 text-white/60">
          Ao tocar em <em>Solicitar via WhatsApp</em> abaixo, você é levado ao
          canal oficial da DGN Club (final 6936). O status por aqui será
          <strong className="text-white/85"> Solicitação enviada</strong> — a
          equipe DGN confirma o horário antes de considerar como
          <em> Agendamento confirmado</em>.
        </p>
        <a
          href={DGN_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Solicitar via WhatsApp (final 6936)
        </a>
        <p className="mt-3 text-[11px] text-white/40">
          Nenhuma mensagem é enviada automaticamente por esta tela. Você
          escreve a solicitação diretamente no WhatsApp.
        </p>
      </section>
    </PortalShell>
  );
}
