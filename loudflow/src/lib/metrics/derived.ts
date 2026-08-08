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

// Custo por LPV em centavos. Aceita LPV nulo (não disponível → resultado nulo).
export function costPerLpvCents(spendCents: number, lpv: number | null): number | null {
  if (lpv == null || !lpv) return null;
  return spendCents / lpv;
}

export type MetricAggregate = {
  spendCents: number;
  impressions: number;
  clicks: number;
  landingPageViews: number | null;
  initiateCheckouts: number | null;
  leads: number | null;
};

export type SnapshotLike = {
  spend_cents: number;
  impressions: number;
  clicks: number;
  landing_page_views: number | null;
  initiate_checkouts: number | null;
  leads: number | null;
};

// Soma segura ciente da diferença entre null (não disponível) e 0.
// Se TODOS os snapshots reportarem null para a métrica, o resultado é null.
// Se pelo menos um reportar um número, o resultado é a soma dos números
// (os null são tratados como "sem contribuição").
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
  }

  return {
    spendCents: spend,
    impressions,
    clicks,
    landingPageViews: lpvSeen ? lpv : null,
    initiateCheckouts: icSeen ? ic : null,
    leads: leadsSeen ? leads : null,
  };
}
