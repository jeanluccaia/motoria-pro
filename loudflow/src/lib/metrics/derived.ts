// Cálculos derivados usados no painel. Diferença explícita entre "métrica
// não disponível" (null) e "métrica zero" (0). Divisão por zero nunca é
// executada — retorna null em vez de Infinity/NaN.

export function safeDivide(numer: number, denom: number): number | null {
  if (!denom) return null;
  return numer / denom;
}

// CTR em porcentagem (0–100), a partir de cliques/impressões inteiras.
export function ctrPercent(clicks: number, impressions: number): number | null {
  if (!impressions) return null;
  return (clicks / impressions) * 100;
}

// CPC em centavos, a partir de spend em centavos e cliques inteiros.
export function cpcCents(spendCents: number, clicks: number): number | null {
  if (!clicks) return null;
  return spendCents / clicks;
}

// CPM em centavos (custo a cada 1.000 impressões).
export function cpmCents(spendCents: number, impressions: number): number | null {
  if (!impressions) return null;
  return (spendCents / impressions) * 1000;
}

// Custo por LPV em centavos. Aceita LPV nulo (não disponível → resultado nulo).
export function costPerLpvCents(spendCents: number, lpv: number | null): number | null {
  if (lpv == null || !lpv) return null;
  return spendCents / lpv;
}

// ROAS = receita / investimento. Retorna null quando investimento é zero.
export function roas(revenueCents: number, spendCents: number): number | null {
  if (!spendCents) return null;
  return revenueCents / spendCents;
}

// ROI = (receita − investimento) / investimento. Null quando investimento
// é zero (evita divisão por zero e "infinito").
export function roi(revenueCents: number, spendCents: number): number | null {
  if (!spendCents) return null;
  return (revenueCents - spendCents) / spendCents;
}

export type MetricAggregate = {
  spendCents: number;
  impressions: number;
  clicks: number;
  landingPageViews: number | null;
  initiateCheckouts: number | null;
  leads: number | null;
  conversations: number | null;
  reachEstimated: number | null;
  approvedOrdersCount: number;
  pendingOrdersCount: number;
  refundedOrdersCount: number;
  revenueCents: number;
  grossRevenueCents: number;
};

export type SnapshotLike = {
  spend_cents: number;
  impressions: number;
  clicks: number;
  landing_page_views: number | null;
  initiate_checkouts: number | null;
  leads: number | null;
  conversations?: number | null;
  reach_estimated?: number | null;
  approved_orders_count?: number | null;
  pending_orders_count?: number | null;
  refunded_orders_count?: number | null;
  revenue_cents?: number | null;
  gross_revenue_cents?: number | null;
};

// Soma segura ciente da diferença entre null (não disponível) e 0.
// Se TODOS os snapshots reportarem null para a métrica, o resultado é null.
// Se pelo menos um reportar um número, o resultado é a soma dos números
// (os null são tratados como "sem contribuição").
//
// Reach agregado NÃO é matematicamente correto (usuários únicos não
// somam entre dias), mas para o painel diário usamos a soma como
// "estimativa acumulada" e sempre exibimos com o rótulo "estimado".
export function aggregateMetrics(snapshots: SnapshotLike[]): MetricAggregate {
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let lpv = 0;
  let lpvSeen = false;
  let ic = 0;
  let icSeen = false;
  let leads = 0;
  let leadsSeen = false;
  let convs = 0;
  let convsSeen = false;
  let reach = 0;
  let reachSeen = false;
  let approved = 0;
  let pending = 0;
  let refunded = 0;
  let revenue = 0;
  let gross = 0;

  for (const s of snapshots) {
    spend += s.spend_cents;
    impressions += s.impressions;
    clicks += s.clicks;
    if (s.landing_page_views != null) {
      lpv += s.landing_page_views;
      lpvSeen = true;
    }
    if (s.initiate_checkouts != null) {
      ic += s.initiate_checkouts;
      icSeen = true;
    }
    if (s.leads != null) {
      leads += s.leads;
      leadsSeen = true;
    }
    if (s.conversations != null) {
      convs += s.conversations;
      convsSeen = true;
    }
    if (s.reach_estimated != null) {
      reach += s.reach_estimated;
      reachSeen = true;
    }
    approved += s.approved_orders_count ?? 0;
    pending += s.pending_orders_count ?? 0;
    refunded += s.refunded_orders_count ?? 0;
    revenue += s.revenue_cents ?? 0;
    gross += s.gross_revenue_cents ?? 0;
  }

  return {
    spendCents: spend,
    impressions,
    clicks,
    landingPageViews: lpvSeen ? lpv : null,
    initiateCheckouts: icSeen ? ic : null,
    leads: leadsSeen ? leads : null,
    conversations: convsSeen ? convs : null,
    reachEstimated: reachSeen ? reach : null,
    approvedOrdersCount: approved,
    pendingOrdersCount: pending,
    refundedOrdersCount: refunded,
    revenueCents: revenue,
    grossRevenueCents: gross,
  };
}
