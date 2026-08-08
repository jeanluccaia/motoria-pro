import type { UtmifyClient, UtmifyFetchError, UtmifyFetchResult, UtmifyDailyResult } from "./types";

// Cliente fake para testes automatizados. Mantém o mesmo contrato do
// cliente HTTP: `fetchDay(date)` sempre resolve; falhas simuladas viram
// { ok: false, error }.
export type FakeConfig = {
  configured?: boolean;
  days?: Record<string, UtmifyDailyResult>;
  failOn?: Record<string, UtmifyFetchError>;
};

export function createUtmifyFakeClient(cfg: FakeConfig = {}): UtmifyClient {
  const days = cfg.days ?? {};
  const failOn = cfg.failOn ?? {};
  const configured = cfg.configured !== false;

  return {
    isConfigured: () => configured,
    async fetchDay(date: string): Promise<UtmifyFetchResult> {
      const failure = failOn[date];
      if (failure) return { ok: false, error: failure };
      const day = days[date] ?? { date, rows: [] };
      return { ok: true, day };
    },
  };
}
