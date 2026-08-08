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

  test("mesmo dia repetido não infla presentDays (dedupe por Set)", () => {
    // Regressão da Fase 3.2A: o mesmo snapshot_date aparecendo N vezes
    // no input NÃO pode contar como N dias sincronizados. A cobertura
    // é sobre datas distintas, não sobre linhas.
    const cov = computeCoverage({
      fromYmd: "2026-08-05",
      toYmd: "2026-08-05",
      snapshotDatesInPeriod: ["2026-08-05", "2026-08-05", "2026-08-05"],
      firstAvailableYmd: "2026-08-05",
    });
    expect(cov.presentDays).toEqual(["2026-08-05"]);
    expect(cov.presentDays.length).toBe(1);
    expect(cov.totalDays).toBe(1);
    expect(cov.fullyCovered).toBe(true);
  });

  test("múltiplas campanhas no mesmo dia contam como 1 data sincronizada", () => {
    // Cenário real: 15+ campanhas com snapshot no mesmo dia. A cobertura
    // deve refletir 1 dia (não 15), pois "dia sincronizado" é sobre a
    // existência de qualquer snapshot naquela data.
    const dailyDupes = Array.from({ length: 17 }, () => "2026-08-05");
    const cov = computeCoverage({
      fromYmd: "2026-08-01",
      toYmd: "2026-08-07",
      snapshotDatesInPeriod: dailyDupes,
      firstAvailableYmd: "2026-08-05",
    });
    expect(cov.presentDays).toEqual(["2026-08-05"]);
    expect(cov.missingDays.length).toBe(6);
    expect(cov.totalDays).toBe(7);
    expect(cov.partial).toBe(true);
  });

  test("Fase 3.2A: 30 dias com 10 datas sincronizadas via múltiplas campanhas → 10/20", () => {
    // Reprodução exata do cenário: 10 dias contínuos (2026-07-29 a
    // 2026-08-07) foram importados via MCP. Cada dia tem entre 3 e 17
    // campanhas com snapshot. O preset "30 dias" (2026-07-09 a 2026-08-07)
    // deve reportar 10 dias sincronizados e 20 ausentes — não 104 nem 12
    // nem qualquer outro valor.
    const days = [
      "2026-07-29", "2026-07-30", "2026-07-31",
      "2026-08-01", "2026-08-02", "2026-08-03",
      "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07",
    ];
    // Simular a distribuição real observada em produção: várias campanhas
    // por dia (repetição intencional).
    const perDay: Record<string, number> = {
      "2026-07-29": 16, "2026-07-30": 13, "2026-07-31": 8,
      "2026-08-01": 3, "2026-08-02": 3, "2026-08-03": 9,
      "2026-08-04": 10, "2026-08-05": 17, "2026-08-06": 13,
      "2026-08-07": 12,
    };
    const inflatedDates: string[] = [];
    for (const d of days) {
      for (let i = 0; i < perDay[d]; i++) inflatedDates.push(d);
    }
    expect(inflatedDates.length).toBe(104); // sanity check: soma das rows

    const cov = computeCoverage({
      fromYmd: "2026-07-09",
      toYmd: "2026-08-07",
      snapshotDatesInPeriod: inflatedDates,
      firstAvailableYmd: "2026-07-29",
    });

    expect(cov.totalDays).toBe(30);
    expect(cov.presentDays.length).toBe(10);
    expect(cov.missingDays.length).toBe(20);
    expect(cov.partial).toBe(true);
    expect(cov.fullyCovered).toBe(false);
    expect(cov.empty).toBe(false);
    expect(cov.presentDays).toEqual(days);
  });
});
