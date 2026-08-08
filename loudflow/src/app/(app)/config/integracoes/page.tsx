import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateTimeBr, formatDateBr } from "@/lib/dates/period";
import { EmptyState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

// /config/integracoes — status das fontes de dados externas do painel.
// Nesta fase, apenas UTMify (via MCP e futuramente via API pública). O objetivo
// é dar visibilidade para o admin sobre "de onde vieram os dados" e "quando
// foram atualizados" — nunca esconder que a sincronização automática ainda
// não está configurada.
export default async function IntegracoesPage() {
  const session = await requireAdmin();
  const admin = getSupabaseAdmin();

  const [lastMcpRun, lastHttpRun, snapshotStats, campaignsCount] = await Promise.all([
    admin
      .from("sync_runs")
      .select("started_at, finished_at, status, period_from, period_to, rows_upserted, campaigns_seen, error_code, error_message, source, triggered_by")
      .eq("organization_id", session.organizationId)
      .eq("source", "utmify_mcp")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("sync_runs")
      .select("started_at, finished_at, status")
      .eq("organization_id", session.organizationId)
      .eq("source", "utmify_http")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("campaign_snapshots")
      .select("snapshot_date")
      .eq("organization_id", session.organizationId)
      .order("snapshot_date", { ascending: true }),
    admin
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organizationId),
  ]);

  const dates = (snapshotStats.data ?? []).map((s) => s.snapshot_date);
  const firstYmd = dates[0] ?? null;
  const lastYmd = dates[dates.length - 1] ?? null;
  const totalSnapshots = dates.length;
  const totalCampaigns = campaignsCount.count ?? 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          UTMify — fonte principal
        </h2>
        <div className="rounded-lg border border-border bg-card p-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fonte ativa" value="UTMify MCP (importação controlada)" />
            <Field
              label="API pública HTTP"
              value="Não configurada — aguardando confirmação do endpoint oficial"
              muted
            />
            <Field
              label="Última importação (MCP)"
              value={
                lastMcpRun.data
                  ? `${formatDateTimeBr(lastMcpRun.data.finished_at ?? lastMcpRun.data.started_at)} · status ${lastMcpRun.data.status}`
                  : "Nunca executada"
              }
            />
            <Field
              label="Período importado"
              value={
                lastMcpRun.data
                  ? `${formatDateBr(lastMcpRun.data.period_from)} → ${formatDateBr(lastMcpRun.data.period_to)}`
                  : "—"
              }
            />
            <Field
              label="Registros processados"
              value={lastMcpRun.data ? String(lastMcpRun.data.rows_upserted) : "—"}
            />
            <Field
              label="Campanhas vistas"
              value={lastMcpRun.data ? String(lastMcpRun.data.campaigns_seen) : "—"}
            />
            {lastHttpRun.data ? (
              <Field
                label="Última sync HTTP"
                value={`${formatDateTimeBr(lastHttpRun.data.finished_at ?? lastHttpRun.data.started_at)} · ${lastHttpRun.data.status}`}
                muted
              />
            ) : null}
          </div>

          {lastMcpRun.data?.error_code ? (
            <p className="mt-4 rounded border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-200">
              Erro na última execução: <strong>{lastMcpRun.data.error_code}</strong>
              {lastMcpRun.data.error_message ? ` — ${lastMcpRun.data.error_message}` : ""}
            </p>
          ) : null}

          <div
            role="status"
            className="mt-4 rounded border border-border/60 bg-lf-graphite/50 p-3 text-xs text-lf-muted"
          >
            Sincronização automática diária ainda não está ativa. Enquanto o
            contrato HTTP oficial da UTMify não é confirmado, um administrador
            executa o script <code className="rounded bg-lf-surface px-1">scripts/import-utmify-mcp.mjs</code>{" "}
            com payloads exportados do MCP.
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Cobertura atual do painel
        </h2>
        <div className="rounded-lg border border-border bg-card p-5 text-sm">
          {totalSnapshots === 0 ? (
            <EmptyState
              title="Sem snapshots"
              description="Nenhum dado histórico ainda. Execute o script de import ou aguarde a próxima sincronização."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Campanhas totais" value={String(totalCampaigns)} />
              <Field label="Snapshots totais" value={String(totalSnapshots)} />
              <Field
                label="Janela disponível"
                value={firstYmd && lastYmd ? `${formatDateBr(firstYmd)} → ${formatDateBr(lastYmd)}` : "—"}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-lf-muted">{label}</span>
      <span className={muted ? "text-lf-muted" : "text-foreground"}>{value}</span>
    </div>
  );
}
