// Contrato do adapter da UTMify. Foi derivado do payload real observado
// no MCP oficial (nível "campaign", Meta Ads) — as métricas são exatamente
// as que a fonte fornece. Colunas anuláveis abaixo representam
// "métrica não fornecida pela fonte" — diferente de zero.
//
// Contagens sempre preenchidas pela UTMify (approvedOrdersCount,
// pendingOrdersCount, refundedOrdersCount) ficam como number com default
// 0 na normalização. Reach é sempre derivado (nunca vem direto do MCP):
// vira number quando frequency > 0, senão null.

export type AdCampaignRow = {
  provider: "meta" | "google";
  externalAccountId: string;
  externalAccountName: string | null;
  externalId: string;
  name: string;
  status: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  landingPageViews: number | null;
  initiateCheckouts: number | null;
  leads: number | null;
  frequency: number | null;
  reachEstimated: number | null;
  conversations: number | null;
  approvedOrdersCount: number;
  pendingOrdersCount: number;
  refundedOrdersCount: number;
  revenueCents: number;
  grossRevenueCents: number;
};

export type UtmifyDailyResult = {
  date: string; // YYYY-MM-DD no fuso da organização
  rows: AdCampaignRow[];
};

export type UtmifyFetchError = {
  code: "not-configured" | "unauthorized" | "rate-limited" | "timeout" | "network" | "unknown";
  message: string;
};

export type UtmifyFetchResult =
  | { ok: true; day: UtmifyDailyResult }
  | { ok: false; error: UtmifyFetchError };

export type UtmifyClient = {
  isConfigured(): boolean;
  // Um dia por chamada, para janelas de sync noturnas simples e idempotentes.
  // A data é sempre interpretada como um dia completo em `America/Sao_Paulo`.
  fetchDay(date: string): Promise<UtmifyFetchResult>;
};
