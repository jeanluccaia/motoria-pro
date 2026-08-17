import { redirect } from "next/navigation";
import { PortalShell } from "../_components/portal-shell";
import { loadCurrentSubscriber } from "@/lib/portal/loader";
import { createPortalClient } from "@/lib/portal/supabase-server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil — DGN Club" };

export default async function PerfilPage() {
  const subscriber = await loadCurrentSubscriber();
  if (subscriber.status === "not_signed_in") redirect("/entrar?next=/perfil");

  const firstName = subscriber.customer?.first_name ?? "assinante";
  const supabase = await createPortalClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PortalShell firstName={firstName} founderBadge={subscriber.founder?.number ?? null} active="perfil">
      <h1 className="text-2xl font-semibold">Seu perfil</h1>

      <section className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Nome</p>
          <p className="mt-1 text-white/90">{subscriber.customer?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">E-mail de acesso</p>
          <p className="mt-1 text-white/90">{user?.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Telefone</p>
          <p className="mt-1 text-white/90">{subscriber.customer?.masked_phone ?? "—"}</p>
        </div>
        {subscriber.founder?.number && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
              Programa Founder
            </p>
            <p className="mt-1 text-amber-200">
              Founder Nº{subscriber.founder.number} — {subscriber.founder.status}
            </p>
          </div>
        )}
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-white/40">
        Alterações de dados pessoais são feitas em contato direto com a
        equipe DGN. Nenhuma senha é armazenada — o acesso é por link seguro
        enviado ao seu e-mail cadastrado.
      </p>
    </PortalShell>
  );
}
