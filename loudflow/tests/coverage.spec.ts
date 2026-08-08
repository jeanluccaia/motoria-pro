import { test, expect } from "@playwright/test";
import { computeCoverage } from "../src/lib/metrics/coverage";
import { aggregateMetrics } from "../src/lib/metrics/derived";

// Fase 3.1 — cobertura do período no painel de resultados.
// A ausência de dias sincronizados NUNCA pode ser interpretada como zero.

test.describe("Coverage do período", () => {
  test("período totalmente coberto → fullyCovered=true, partial=false", () => {
    const cov = computeCoverage({
      fromYmd: "2026-08-05",
      toYmd: "2026-08-06",
      snapshotDatesInPeriod: ["2026-08-05", "2026-08-06"],
      firstAvailableYmd: "2026-08-05",
    });
    expect(cov.fullyCovered).toBe(true);
    expect(cov.partial).toBe(false);
    expect(cov.empty).toBe(false);
    expect(cov.missingDays).toEqual([]);
  });

  test("período parcialmente coberto → partial=true, missingDays lista os buracos", () => {
    const cov = computeCoverage({
      fromYmd: "2026-08-01",
      toYmd: "2026-08-06",
      snapshotDatesInPeriod: ["2026-08-05", "2026-08-06"],
      firstAvailableYmd: "2026-08-05",
    });
    expect(cov.partial).toBe(true);
    expect(cov.fullyCovered).toBe(false);
    expect(cov.empty).toBe(false);
    expect(cov.missingDays).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
    ]);
    expect(cov.presentDays).toEqual(["2026-08-05", "2026-08-06"]);
  });

  test("ausência completa de snapshots → empty=true, partial=false", () => {
    const cov = computeCoverage({
      fromYmd: "2026-08-01",
      toYmd: "2026-08-06",
      snapshotDatesInPeriod: [],
      firstAvailableYmd: "2026-08-10",
    });
    expect(cov.empty).toBe(true);
    expect(cov.partial).toBe(false);
    expect(cov.fullyCovered).toBe(false);
    expect(cov.presentDays).toEqual([]);
    expect(cov.missingDays.length).toBe(6);
  });

  test("snapshot com métricas zero conta como dia coberto", () => {
    // O importante: um dia sincronizado permanece "presente" mesmo que todas
    // as métricas venham como 0 — isso é diferente de "dia sem sync".
    const cov = computeCoverage({
      fromYmd: "2026-08-05",
      toYmd: "2026-08-05",
      snapshotDatesInPeriod: ["2026-08-05"],
      firstAvailableYmd: "2026-08-05",
    });
    expect(cov.fullyCovered).toBe(true);
    expect(cov.empty).toBe(false);

    const agg = aggregateMetrics([
      {
        spend_cents: 0,
        impressions: 0,
        clicks: 0,
        landing_page_views: 0,
        initiate_checkouts: 0,
        leads: 0,
      },
    ]);
    // Métrica reportada = 0. Não vira null.
    expect(agg.spendCents).toBe(0);
    expect(agg.impressions).toBe(0);
    expect(agg.landingPageViews).toBe(0);
    expect(agg.initiateCheckouts).toBe(0);
  });

  test("dia não sincronizado NÃO é interpretado como zero pelo agregador", () => {
    // Se todos os snapshots devolvem null para uma métrica, o agregado é null
    // ("não disponível"), nunca 0.
    const agg = aggregateMetrics([
      { spend_cents: 100, impressions: 50, clicks: 5, landing_page_views: null, initiate_checkouts: null, leads: null },
      { spend_cents: 200, impressions: 80, clicks: 6, landing_page_views: null, initiate_checkouts: null, leads: null },
    ]);
    expect(agg.spendCents).toBe(300);
    expect(agg.landingPageViews).toBeNull();
    expect(agg.initiateCheckouts).toBeNull();
    expect(agg.leads).toBeNull();
  });

  test("mistura null+número: agregado usa a soma dos números, ignora null", () => {
    const agg = aggregateMetrics([
      { spend_cents: 100, impressions: 50, clicks: 5, landing_page_views: null, initiate_checkouts: 3, leads: null },
      { spend_cents: 200, impressions: 80, clicks: 6, landing_page_views: 10, initiate_checkouts: null, leads: null },
    ]);
    expect(agg.landingPageViews).toBe(10);
    expect(agg.initiateCheckouts).toBe(3);
    expect(agg.leads).toBeNull();
  });

  test("período com apenas o primeiro dia disponível fora do range → empty", () => {
    const cov = computeCoverage({
      fromYmd: "2026-07-01",
      toYmd: "2026-07-31",
      snapshotDatesInPeriod: [],
      firstAvailableYmd: "2026-08-05",
    });
    expect(cov.empty).toBe(true);
    expect(cov.firstAvailableYmd).toBe("2026-08-05");
  });
});
