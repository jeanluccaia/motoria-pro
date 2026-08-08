import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shell/states";
import type { Unit } from "@/lib/supabase/types";
import { CampaignsMapper } from "./mapper";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await requireAdmin();
  // Admin: usa client admin para ler tudo (bypass RLS de unit_manager).
  const admin = getSupabaseAdmin();

  const [campaignsRes, unitsRes] = await Promise.all([
    admin
      .from("campaigns")
      .select(
        "id, name, provider, external_account_name, status, unit_id, unit_source",
      )
      .eq("organization_id", session.organizationId)
      .order("unit_source", { ascending: true }) // 'auto' → 'manual' → 'unresolved'
      .order("name", { ascending: true }),
    admin
      .from("units")
      .select("id, name, archived_at")
      .eq("organization_id", session.organizationId)
      .order("name", { ascending: true }),
  ]);
  if (campaignsRes.error) throw new Error(campaignsRes.error.message);
  if (unitsRes.error) throw new Error(unitsRes.error.message);

  const campaigns = (campaignsRes.data ?? []).map(
    (c) =>
      ({
        id: c.id,
        name: c.name,
        provider: c.provider,
        externalAccountName: c.external_account_name,
        status: c.status,
        unitId: c.unit_id,
        unitSource: c.unit_source,
      }) as Parameters<typeof CampaignsMapper>[0]["campaigns"][number],
  );
  const units = ((unitsRes.data ?? []) as Unit[])
    .filter((u) => !u.archived_at)
    .map((u) => ({ id: u.id, name: u.name }));

  const unresolved = campaigns.filter((c) => c.unitSource === "unresolved");
  const mapped = campaigns.filter((c) => c.unitSource !== "unresolved");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Regra de nomenclatura
        </h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-lf-muted">
          <p>
            Padrão oficial:{" "}
            <code className="rounded bg-lf-surface px-1 py-0.5 text-foreground">
              LF | [UNIDADE] | [OBJETIVO] | [MÊS/ANO]
            </code>
          </p>
          <p className="mt-2">
            O sistema tenta identificar a unidade pelo nome da campanha (Ipiranga,
            Amoreiras, Mogi Mirim, Vila Industrial, Carrefour Valinhos). Quando
            não consegue, a campanha fica aqui embaixo em <em>Sem unidade</em>.
            Mapeamento manual sempre vence o automático.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
            Sem unidade ({unresolved.length})
          </h2>
        </div>
        {unresolved.length === 0 ? (
          <EmptyState
            title="Todas as campanhas estão mapeadas"
            description="Novas campanhas aparecem aqui quando o parser não conseguir identificar a unidade."
          />
        ) : (
          <CampaignsMapper campaigns={unresolved} units={units} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Já mapeadas ({mapped.length})
        </h2>
        {mapped.length === 0 ? (
          <EmptyState
            title="Nenhuma campanha mapeada ainda"
            description="Sincronize com a UTMify para começar a receber campanhas."
          />
        ) : (
          <CampaignsMapper campaigns={mapped} units={units} />
        )}
      </section>
    </div>
  );
}

