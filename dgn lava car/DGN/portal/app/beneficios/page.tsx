import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber } from "@/lib/portal/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Benefícios — DGN Club" };

export default async function BeneficiosPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/beneficios");

  const firstName = subscriber.customer?.first_name ?? "assinante";

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="beneficios">
      <h1 className="text-2xl font-semibold">Benefícios</h1>
      <p className="mt-1 text-sm text-white/60">
        Vantagens exclusivas para assinantes DGN Club.
      </p>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
        <p className="text-white/85 font-medium">Detalhes chegam em breve.</p>
        <p className="mt-2">
          Estamos consolidando o catálogo oficial de benefícios da versão
          atual dos planos. Nenhuma promoção fictícia é exibida.
        </p>
      </section>
    </PortalShell>
  );
}
