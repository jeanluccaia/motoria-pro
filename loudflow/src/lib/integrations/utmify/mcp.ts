// Adaptador de importação a partir do payload real do MCP oficial da UTMify
// (tool `mcp__claude_ai_utmify__get_meta_ad_objects`, nível "campaign").
//
// Este arquivo é *somente* normalização — não faz chamadas de rede,
// não conhece Supabase, não conhece o banco. Recebe o objeto exato que o
// MCP devolve (validado por tipagem estrutural mínima) e produz
// `UtmifyDailyResult` já pronto para o motor de sync.
//
// Regras oficiais definidas na Fase 3.2A:
//   * spend/revenue/grossRevenue vêm em centavos e são preservados assim.
//   * frequency é decimal; reach_estimated = round(impressions/frequency)
//     apenas quando frequency > 0. Caso contrário null (explicitamente
//     "não foi possível estimar", não "reach = 0").
//   * `salesFromFacebook` NÃO é venda — é atribuição de pixel. Ignorado.
//   * `leads`, `initiateCheckout`, `conversations` NUNCA viram matrícula.
//   * `approvedOrdersCount` é a única fonte de "vendas aprovadas".
//   * `revenue` é receita líquida; `grossRevenue` bruta — preservadas
//     separadamente.
//   * Campos ausentes/undefined nas contagens NOT NULL viram 0 na
//     normalização, e nos nullables (LPV, IC, leads, conversations)
//     permanecem null.
//
// Divergência observada entre agregação diária e agregação por range
// (comportamento upstream — UTMify/Meta —, não bug do adapter):
//   Somar N chamadas de 1 dia via este adapter NÃO produz aritmeticamente
//   os mesmos números que pedir o mesmo range ao mesmo endpoint em uma
//   única chamada. Exemplo observado na Fase 3.2A (2026-07-29..08-07,
//   Meta, 3 contas Loud Fit):
//     * soma 10 dailies de get_meta_ad_objects   : 167.894c spend · 1.118 clk · 235 LPV · 113 IC
//     * get_meta_ad_objects range 10d único       : 167.693c spend · 1.114 clk · 231 LPV · 111 IC
//     * get_dashboard_summary range 10d           : idêntico ao range único
//   Os dois endpoints agregados coincidem entre si; a diferença nasce
//   entre "soma diária" e "chamada única do range". Chamadas repetidas
//   dos endpoints agregados retornaram os mesmos números (não é timing).
//   Sem documentação oficial pública para atribuir causa definitiva —
//   plausível envolver reconciliações/deduplicações aplicadas pela
//   UTMify ou pelo próprio Meta ao agregar períodos maiores que 1 dia.
//   O adapter NÃO força reconciliação: o painel precisa da granularidade
//   diária para os presets Ontem/7d/30d. Divergência típica observada:
//   ~0,12% em spend e 1–2% em métricas de eventos (cliques, LPV, IC).

import type { AdCampaignRow, UtmifyDailyResult } from "./types";

// Formato bruto (subset) do que o MCP retorna. Deixamos o tipo enxuto ao
// que consumimos — o payload real tem muito mais campos que ignoramos
// (video metrics, CPTs, etc.). Nada é inventado.
export type McpMetaAdObject = {
  id: string;
  accountId: string;
  ca?: string | null; // nome da conta (padrão MCP)
  externalAccountName?: string | null;
  campaignId: string | null;
  adsetId: string | null;
  adId: string | null;
  level: "account" | "campaign" | "adset" | "ad";
  name: string;
  status?: string | null;
  effectiveStatus?: string | null;

  spend?: number | null;
  impressions?: number | null;
  inlineLinkClicks?: number | null;
  landingPageViews?: number | null;
  initiateCheckout?: number | null;
  leads?: number | null;
  conversations?: number | null;
  frequency?: number | null;

  approvedOrdersCount?: number | null;
  pendingOrdersCount?: number | null;
  refundedOrdersCount?: number | null;
  revenue?: number | null;
  grossRevenue?: number | null;
};

export type McpMetaResponse = {
  results: McpMetaAdObject[];
  soldProducts?: unknown[];
  untrackedCount?: number;
};

export type McpNormalizeInput = {
  date: string; // YYYY-MM-DD (fuso da organização)
  payload: McpMetaResponse;
};

export type McpNormalizeOptions = {
  // Se true, mantém campanhas com todas as métricas de exposição zeradas
  // (impressions=0, spend=0, clicks=0). Default: false — descarta ruído
  // típico de campanhas pausadas há dias.
  keepZeroExposure?: boolean;
};

// Deriva reach estimado apenas quando frequency > 0. Retorna null caso
// contrário — "não foi possível estimar" ≠ "reach = 0".
export function deriveReachEstimated(
  impressions: number | null | undefined,
  frequency: number | null | undefined,
): number | null {
  if (impressions == null || frequency == null) return null;
  if (!Number.isFinite(impressions) || !Number.isFinite(frequency)) return null;
  if (frequency <= 0) return null;
  const reach = impressions / frequency;
  if (!Number.isFinite(reach)) return null;
  return Math.round(reach);
}

// Conversão segura para inteiro >= 0. O MCP às vezes retorna floats
// muito próximos de inteiros para métricas que deveriam ser contagem.
function toIntNonNegative(v: number | null | undefined): number {
  if (v == null || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}

function toIntNullable(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.max(0, Math.round(v));
}

function toCents(v: number | null | undefined): number {
  // spend/revenue já vêm em centavos no MCP; só normalizamos para inteiro
  // não-negativo. Se um dia a fonte enviar decimais, arredondamos e
  // registramos o piso em 0.
  if (v == null || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}

// Nome externo da conta pode vir em `ca` (padrão MCP) ou
// `externalAccountName`. Adotamos `ca` primeiro por ser o que o MCP real
// devolve; o outro é preservado para robustez futura.
function pickAccountName(o: McpMetaAdObject): string | null {
  const raw = (o.ca ?? o.externalAccountName ?? null) as string | null;
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  return trimmed.length === 0 ? null : trimmed;
}

function pickStatus(o: McpMetaAdObject): string {
  const raw = o.effectiveStatus ?? o.status ?? "UNKNOWN";
  return String(raw);
}

// Normaliza uma única linha do MCP → linha do adapter.
export function normalizeMcpRow(o: McpMetaAdObject): AdCampaignRow {
  const impressions = toIntNonNegative(o.impressions);
  const frequency = o.frequency == null || !Number.isFinite(o.frequency) ? null : Number(o.frequency);

  return {
    provider: "meta",
    externalAccountId: String(o.accountId),
    externalAccountName: pickAccountName(o),
    externalId: String(o.campaignId ?? o.id),
    name: String(o.name),
    status: pickStatus(o),
    spendCents: toCents(o.spend),
    impressions,
    clicks: toIntNonNegative(o.inlineLinkClicks),
    landingPageViews: toIntNullable(o.landingPageViews),
    initiateCheckouts: toIntNullable(o.initiateCheckout),
    leads: toIntNullable(o.leads),
    frequency,
    reachEstimated: deriveReachEstimated(impressions, frequency),
    conversations: toIntNullable(o.conversations),
    approvedOrdersCount: toIntNonNegative(o.approvedOrdersCount),
    pendingOrdersCount: toIntNonNegative(o.pendingOrdersCount),
    refundedOrdersCount: toIntNonNegative(o.refundedOrdersCount),
    revenueCents: toCents(o.revenue),
    grossRevenueCents: toCents(o.grossRevenue),
  };
}

// Normaliza a resposta MCP inteira para um dia específico. Descarta
// entradas que não são de nível "campaign" (ex: totais de conta em
// consultas mistas) e ruído sem qualquer sinal quando keepZeroExposure
// é false (default).
export function normalizeMcpMetaResponse(
  input: McpNormalizeInput,
  options: McpNormalizeOptions = {},
): UtmifyDailyResult {
  const keepZero = options.keepZeroExposure === true;
  const raw = input.payload.results ?? [];
  const rows: AdCampaignRow[] = [];

  for (const item of raw) {
    if (item.level !== "campaign") continue;
    if (!item.campaignId && !item.id) continue;

    const row = normalizeMcpRow(item);
    if (!keepZero) {
      const hasSignal =
        row.spendCents > 0 ||
        row.impressions > 0 ||
        row.clicks > 0 ||
        (row.leads ?? 0) > 0 ||
        (row.landingPageViews ?? 0) > 0 ||
        (row.initiateCheckouts ?? 0) > 0 ||
        (row.conversations ?? 0) > 0 ||
        row.approvedOrdersCount > 0 ||
        row.pendingOrdersCount > 0 ||
        row.revenueCents > 0 ||
        row.grossRevenueCents > 0;
      if (!hasSignal) continue;
    }
    rows.push(row);
  }

  return { date: input.date, rows };
}
