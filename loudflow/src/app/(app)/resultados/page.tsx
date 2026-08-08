import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/states";
import { presetRange, formatDateBr, formatDateTimeBr, type PeriodPreset } from "@/lib/dates/period";
import {
  formatCurrencyCents,
  formatInteger,
  formatPercent,
  NOT_AVAILABLE_LABEL,
} from "@/lib/metrics/format";
import { aggregateMetrics, ctrPercent, cpcCents, cpmCents, costPerLpvCents, roas, roi } from "@/lib/metrics/derived";
import { computeCoverage } from "@/lib/metrics/coverage";
import type { Campaign, CampaignSnapshot } from "@/lib/supabase/types";
import { KpiCard } from "./kpi-card";
import { SyncButton } from "./sync-button";

export const metadata: Metadata = { title: "Resultados" };
export const dynamic = "force-dynamic";

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "yesterday", label: "Ontem" },
  { key: "last7", label: "Últimos 7 dias" },
  { key: "last30", label: "Últimos 30 dias" },
];

type SearchParams = {
  p?: string;
  unit?: string;
  provider?: string;
  campaign?: string;
};

export default async function ResultadosPage(props: PageProps<"/resultados">) {
  const session = await requireSession();
  const search = (await props.searchParams) as SearchParams;

  const preset = normalizePreset(search.p);
  const range = presetRange(preset);
  if (!range) {
    // "custom" ainda não suportado — cai no default "Ontem".
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdmin();
  const isAdmin = session.role === "admin";

  // Carregamentos em paralelo. `lastSync` e `firstSnapshot` usam admin client
  // para permitir que sócio/marketing/unit_manager vejam a cobertura real —
  // dados agregados/técnicos sem PII, sem quebrar RLS por unidade nas outras
  // consultas.
  const [campaignsRes, snapshotsRes, unitsRes, lastSyncRes, firstSnapshotRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, provider, external_id, name, status, unit_id, unit_source")
      .eq("organization_id", session.organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("campaign_snapshots")
      .select(
        "id, campaign_id, provider, snapshot_date, spend_cents, impressions, clicks, landing_page_views, initiate_checkouts, leads, frequency, reach_estimated, conversations, approved_orders_count, pending_orders_count, refunded_orders_count, revenue_cents, gross_revenue_cents",
      )
      .eq("organization_id", session.organizationId)
      .gte("snapshot_date", range.fromYmd)
      .lte("snapshot_date", range.toYmd),
    supabase
      .from("units")
      .select("id, name, archived_at")
      .eq("organization_id", session.organizationId)
      .order("name", { ascending: true }),
    admin
      .from("sync_runs")
      .select("finished_at, status, period_to")
      .eq("organization_id", session.organizationId)
      .in("status", ["success", "partial"])
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("campaign_snapshots")
      .select("snapshot_date")
      .eq("organization_id", session.organizationId)
      .order("snapshot_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (campaignsRes.error) throw new Error(campaignsRes.error.message);
  if (snapshotsRes.error) throw new Error(snapshotsRes.error.message);
  if (unitsRes.error) throw new Error(unitsRes.error.message);

  const campaigns = (campaignsRes.data ?? []) as Array<
    Pick<Campaign, "id" | "provider" | "external_id" | "name" | "status" | "unit_id" | "unit_source">
  >;
  const snapshots = (snapshotsRes.data ?? []) as Array<
    Pick<
      CampaignSnapshot,
      | "id"
      | "campaign_id"
      | "provider"
      | "snapshot_date"
      | "spend_cents"
      | "impressions"
      | "clicks"
      | "landing_page_views"
      | "initiate_checkouts"
      | "leads"
      | "frequency"
      | "reach_estimated"
      | "conversations"
      | "approved_orders_count"
      | "pending_orders_count"
      | "refunded_orders_count"
      | "revenue_cents"
      | "gross_revenue_cents"
    >
  >;
  const units = (unitsRes.data ?? [])
    .filter((u) => !u.archived_at)
    .map((u) => ({ id: u.id, name: u.name }));

  const campaignById = new Map(campaigns.map((c) => [c.id, c]));

  // Aplicação dos filtros no server. A UI apenas navega para novos query params.
  const activeUnit = normalizeUnitFilter(search.unit, units);
  const activeProvider = normalizeProviderFilter(search.provider);
  const activeCampaignId = search.campaign && campaignById.has(search.campaign) ? search.campaign : null;

  const filteredSnapshots = snapshots.filter((s) => {
    const c = campaignById.get(s.campaign_id);
    if (!c) return false;
    if (activeCampaignId && s.campaign_id !== activeCampaignId) return false;
    if (activeProvider && s.provider !== activeProvider) return false;
    if (activeUnit === "__UNMAPPED__" && c.unit_id !== null) return false;
    if (activeUnit && activeUnit !== "__UNMAPPED__" && c.unit_id !== activeUnit) return false;
    return true;
  });

  const agg = aggregateMetrics(filteredSnapshots);
  const ctr = ctrPercent(agg.clicks, agg.impressions);
  const cpc = cpcCents(agg.spendCents, agg.clicks);
  const cpm = cpmCents(agg.spendCents, agg.impressions);
  const cpLpv = costPerLpvCents(agg.spendCents, agg.landingPageViews);
  const roasValue = roas(agg.revenueCents, agg.spendCents);
  const roiValue = roi(agg.revenueCents, agg.spendCents);
  const hasRevenue = agg.revenueCents > 0 || agg.grossRevenueCents > 0;
  const hasApprovedOrders = agg.approvedOrdersCount > 0;

  const hasData = filteredSnapshots.length > 0;
  const totalCampaigns = campaigns.length;
  const unmappedCount = campaigns.filter((c) => c.unit_id === null).length;

  const lastSyncLabel = formatDateTimeBr(lastSyncRes.data?.finished_at);
  const lastSyncStatus = lastSyncRes.data?.status ?? null;
  const firstAvailableYmd = firstSnapshotRes.data?.snapshot_date ?? null;

  // Cobertura do período selecionado. Diferencia "dia sem sync" de
  // "dia sincronizado com métrica zero".
  const coverage = computeCoverage({
    fromYmd: range.fromYmd,
    toYmd: range.toYmd,
    snapshotDatesInPeriod: filteredSnapshots.map((s) => s.snapshot_date),
    firstAvailableYmd,
  });

  // Ranking simples (top 5 por spend). Só faz sentido quando há dados.
  const perCampaign = new Map<
    string,
    { name: string; unitId: string | null; spendCents: number; clicks: number; impressions: number }
  >();
  for (const s of filteredSnapshots) {
    const c = campaignById.get(s.campaign_id);
    if (!c) continue;
    const entry = perCampaign.get(s.campaign_id) ?? {
      name: c.name,
      unitId: c.unit_id,
      spendCents: 0,
      clicks: 0,
      impressions: 0,
    };
    entry.spendCents += s.spend_cents;
    entry.clicks += s.clicks;
    entry.impressions += s.impressions;
    perCampaign.set(s.campaign_id, entry);
  }
  const topCampaigns = Array.from(perCampaign.values())
    .sort((a, b) => b.spendCents - a.spendCents)
    .slice(0, 5);

  // Comparação por unidade — soma spend/clicks por unit_id.
  const unitAgg = new Map<
    string | null,
    { spendCents: number; clicks: number; impressions: number }
  >();
  for (const s of filteredSnapshots) {
    const c = campaignById.get(s.campaign_id);
    if (!c) continue;
    const key = c.unit_id;
    const entry = unitAgg.get(key) ?? { spendCents: 0, clicks: 0, impressions: 0 };
    entry.spendCents += s.spend_cents;
    entry.clicks += s.clicks;
    entry.impressions += s.impressions;
    unitAgg.set(key, entry);
  }
  const unitNameById = new Map(units.map((u) => [u.id, u.name]));
  const byUnit = Array.from(unitAgg.entries())
    .map(([unitId, v]) => ({
      unitId,
      unitLabel: unitId === null ? "Sem unidade mapeada" : unitNameById.get(unitId) ?? "—",
      ...v,
    }))
    .sort((a, b) => b.spendCents - a.spendCents);

  const periodLabel =
    range.fromYmd === range.toYmd
      ? formatDateBr(range.fromYmd)
      : `${formatDateBr(range.fromYmd)} — ${formatDateBr(range.toYmd)}`;

  return (
    <>
      <PageHeader
        eyebrow="Resultados"
        title="Resultados"
        description={
          lastSyncLabel
            ? `${periodLabel} · Atualizado em ${lastSyncLabel}${lastSyncStatus === "partial" ? " (sincronização parcial)" : ""}`
            : `${periodLabel} · Aguardando primeira sincronização`
        }
        actions={isAdmin ? <SyncButton /> : undefined}
      />

      {firstAvailableYmd ? (
        <p className="mb-4 text-xs text-lf-muted">
          Dados disponíveis desde {formatDateBr(firstAvailableYmd)}.
        </p>
      ) : null}

      {coverage.partial ? (
        <div
          role="status"
          className="mb-6 rounded-md border border-border/60 bg-lf-graphite/50 p-3 text-xs text-lf-muted"
        >
          Este período possui dados parciais.{" "}
          {coverage.missingDays.length}{" "}
          {coverage.missingDays.length === 1 ? "dia sem sincronização" : "dias sem sincronização"}
          {" "}dentro do intervalo selecionado.
        </div>
      ) : null}

      {/* Barra de filtros de período */}
      <section className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const q = buildQuery({
            preset: p.key,
            unit: activeUnit,
            provider: activeProvider,
            campaign: activeCampaignId,
          });
          const active = preset === p.key;
          return (
            <a
              key={p.key}
              href={`/resultados${q}`}
              aria-current={active ? "page" : undefined}
              className={
                "inline-flex h-11 items-center rounded-md border px-4 text-sm font-medium transition-colors lf-focus " +
                (active
                  ? "border-lf-volt bg-lf-surface text-foreground"
                  : "border-border bg-card text-lf-muted hover:text-foreground")
              }
            >
              {p.label}
            </a>
          );
        })}
      </section>

      {/* Filtros de unidade/plataforma/campanha via form GET simples */}
      <form
        method="get"
        action="/resultados"
        className="mb-8 grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-3"
      >
        <input type="hidden" name="p" value={preset} />
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-lf-muted">Unidade</span>
          <select
            name="unit"
            defaultValue={activeUnit ?? ""}
            className="h-11 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
          >
            <option value="">Todas as unidades</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
            {isAdmin ? <option value="__UNMAPPED__">Sem unidade mapeada</option> : null}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-lf-muted">Plataforma</span>
          <select
            name="provider"
            defaultValue={activeProvider ?? ""}
            className="h-11 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
          >
            <option value="">Todas as plataformas</option>
            <option value="meta">Meta Ads</option>
            <option value="google">Google Ads</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-lf-muted">Campanha</span>
          <select
            name="campaign"
            defaultValue={activeCampaignId ?? ""}
            className="h-11 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
          >
            <option value="">Todas as campanhas</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground lf-focus"
          >
            Aplicar filtros
          </button>
        </div>
      </form>

      {/* Estado sem dados */}
      {!hasData ? (
        <EmptyState
          title={
            totalCampaigns === 0
              ? "Primeira sincronização ainda não executada"
              : "Sem dados para o período"
          }
          description={
            totalCampaigns === 0
              ? "A sincronização automática com a UTMify ainda não está disponível. Enquanto isso, os dados existentes são preservados."
              : "Nenhuma campanha teve atividade no intervalo escolhido com os filtros atuais."
          }
        />
      ) : null}

      {/* KPIs principais */}
      {hasData ? (
        <section aria-label="Indicadores principais" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Investimento" value={formatCurrencyCents(agg.spendCents)} />
          <KpiCard label="Impressões" value={formatInteger(agg.impressions)} />
          <KpiCard
            label="Alcance estimado"
            value={formatInteger(agg.reachEstimated)}
            hint="Estimado (impressões ÷ frequência)"
          />
          <KpiCard label="Cliques" value={formatInteger(agg.clicks)} />
          <KpiCard label="CTR" value={formatPercent(ctr)} hint="Cliques ÷ impressões" />
          <KpiCard label="CPC" value={formatCurrencyCents(cpc)} hint="Custo por clique" />
          <KpiCard label="CPM" value={formatCurrencyCents(cpm)} hint="Custo por mil impressões" />
          <KpiCard label="Visualizações da página" value={formatInteger(agg.landingPageViews)} />
          {agg.landingPageViews != null ? (
            <KpiCard label="Custo por visualização" value={formatCurrencyCents(cpLpv)} />
          ) : null}
          <KpiCard label="Leads" value={formatInteger(agg.leads)} />
          <KpiCard label="Conversas" value={formatInteger(agg.conversations)} />
          <KpiCard
            label="Início de checkout"
            value={formatInteger(agg.initiateCheckouts)}
            hint="Não conta como venda"
          />
        </section>
      ) : null}

      {/* Vendas e retorno — dados reais da UTMify. Não confundir com matrículas EVO. */}
      {hasData ? (
        <section aria-label="Vendas e retorno" className="mb-8 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-widest text-lf-muted">
              Vendas e retorno (UTMify)
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Vendas aprovadas"
              value={formatInteger(agg.approvedOrdersCount)}
              hint="approvedOrdersCount da UTMify"
              emphasis={hasApprovedOrders ? "normal" : "muted"}
            />
            <KpiCard
              label="Vendas pendentes"
              value={formatInteger(agg.pendingOrdersCount)}
              emphasis={agg.pendingOrdersCount > 0 ? "normal" : "muted"}
            />
            <KpiCard
              label="Faturamento líquido"
              value={hasRevenue ? formatCurrencyCents(agg.revenueCents) : NOT_AVAILABLE_LABEL}
              hint="revenue da UTMify"
              emphasis={hasRevenue ? "normal" : "muted"}
            />
            <KpiCard
              label="Faturamento bruto"
              value={hasRevenue ? formatCurrencyCents(agg.grossRevenueCents) : NOT_AVAILABLE_LABEL}
              hint="grossRevenue da UTMify"
              emphasis={hasRevenue ? "normal" : "muted"}
            />
            <KpiCard
              label="ROAS"
              value={hasRevenue && roasValue != null ? roasValue.toFixed(2) : NOT_AVAILABLE_LABEL}
              hint="Receita ÷ investimento"
              emphasis={hasRevenue ? "normal" : "muted"}
            />
            <KpiCard
              label="ROI"
              value={hasRevenue && roiValue != null ? formatPercent(roiValue * 100) : NOT_AVAILABLE_LABEL}
              hint="(Receita − investimento) ÷ investimento"
              emphasis={hasRevenue ? "normal" : "muted"}
            />
          </div>
          <p className="text-xs text-lf-muted">
            Vendas e receita vêm direto da UTMify. Leads, conversas e checkouts não são
            matrículas — matrícula real virá da futura integração com o sistema EVO.
          </p>
        </section>
      ) : null}

      {/* Por unidade */}
      {hasData ? (
        <section aria-label="Por unidade" className="mb-8 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-lf-muted">
            Por unidade
          </h2>
          <ul className="grid gap-2">
            {byUnit.map((row) => (
              <li
                key={row.unitId ?? "unmapped"}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
              >
                <span className={row.unitId ? "text-sm" : "text-sm text-lf-muted"}>
                  {row.unitLabel}
                </span>
                <span className="flex items-center gap-4 text-xs text-lf-muted sm:text-sm">
                  <span className="tabular-nums text-foreground">
                    {formatCurrencyCents(row.spendCents)}
                  </span>
                  <span className="tabular-nums">
                    {formatInteger(row.clicks)} cliques
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Top campanhas */}
      {hasData ? (
        <section aria-label="Top campanhas" className="mb-8 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-lf-muted">
            Campanhas com maior investimento
          </h2>
          <ul className="grid gap-2">
            {topCampaigns.map((c) => (
              <li
                key={c.name}
                className="rounded-md border border-border bg-card px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-foreground">{c.name}</span>
                  <span className="tabular-nums text-sm text-foreground">
                    {formatCurrencyCents(c.spendCents)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-lf-muted">
                  <span>
                    {c.unitId === null
                      ? "Sem unidade mapeada"
                      : unitNameById.get(c.unitId) ?? "—"}
                  </span>
                  <span className="tabular-nums">
                    {formatInteger(c.clicks)} cliques · {formatInteger(c.impressions)} impressões
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Aviso para admin quando há campanhas sem mapeamento */}
      {isAdmin && unmappedCount > 0 ? (
        <section className="rounded-md border border-border/60 bg-lf-graphite/50 p-4 text-sm">
          <p className="text-foreground">
            {unmappedCount} {unmappedCount === 1 ? "campanha" : "campanhas"} sem unidade mapeada.
          </p>
          <p className="mt-1 text-xs text-lf-muted">
            Ajuste em{" "}
            <a href="/config/campanhas" className="underline underline-offset-4 lf-focus">
              Configurações · Campanhas
            </a>
            .
          </p>
        </section>
      ) : null}
    </>
  );
}

function normalizePreset(v: string | undefined): PeriodPreset {
  if (v === "last7" || v === "last30" || v === "yesterday") return v;
  return "yesterday";
}

function normalizeUnitFilter(v: string | undefined, units: { id: string }[]): string | null {
  if (!v) return null;
  if (v === "__UNMAPPED__") return v;
  return units.some((u) => u.id === v) ? v : null;
}

function normalizeProviderFilter(v: string | undefined): "meta" | "google" | null {
  if (v === "meta" || v === "google") return v;
  return null;
}

function buildQuery(state: {
  preset: PeriodPreset;
  unit: string | null;
  provider: "meta" | "google" | null;
  campaign: string | null;
}): string {
  const p = new URLSearchParams();
  if (state.preset !== "yesterday") p.set("p", state.preset);
  if (state.unit) p.set("unit", state.unit);
  if (state.provider) p.set("provider", state.provider);
  if (state.campaign) p.set("campaign", state.campaign);
  const s = p.toString();
  return s ? `?${s}` : "";
}
