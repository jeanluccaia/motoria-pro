import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { roleLabel } from "@/lib/auth/labels";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const session = await requireSession();

  return (
    <>
      <PageHeader
        eyebrow="Minha conta"
        title="Minha conta"
        description="Dados do seu acesso e troca de senha."
      />

      <section className="mb-8 rounded-lg border border-border bg-card p-4 text-sm">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-lf-muted">Nome</dt>
            <dd className="mt-1 text-foreground">{session.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-lf-muted">E-mail</dt>
            <dd className="mt-1 break-all text-foreground">{session.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-lf-muted">Papel</dt>
            <dd className="mt-1 text-foreground">{roleLabel(session.role)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Trocar senha
        </h2>
        <p className="text-xs text-lf-muted">
          Depois de trocar, sua sessão continua ativa neste dispositivo.
        </p>
        <ChangePasswordForm />
      </section>
    </>
  );
}
