import "server-only";
import { readUtmifyEnv } from "./env";
import type { UtmifyClient, UtmifyFetchResult, UtmifyFetchError, AdCampaignRow } from "./types";
import { toSaoPauloDayRange } from "../../dates/period";

const TIMEOUT_MS = 20_000;

// Cliente HTTP para a API pública da UTMify. A base URL, o formato exato do
// endpoint e o método de autenticação dependem das envs UTMIFY_API_BASE_URL,
// UTMIFY_API_TOKEN e UTMIFY_DASHBOARD_ID. Sem essas envs, o cliente reporta
// { ok: false, code: 'not-configured' } — que a UI trata como "UTMify não
// configurada" (não como erro genérico).
//
// Enquanto o contrato final da API pública não estiver validado (ver
// docs/INTEGRACAO-UTMIFY.md §2.5), este cliente NÃO faz chamada real. A
// carga inicial de campanhas é feita via script/bootstrap fora deste
// caminho. Deixamos a estrutura pronta para plugar a chamada real com uma
// única alteração aqui.
export function createUtmifyHttpClient(): UtmifyClient {
  return {
    isConfigured() {
      const { baseUrl, token, dashboardId } = readUtmifyEnv();
      return Boolean(baseUrl && token && dashboardId);
    },
    async fetchDay(date: string): Promise<UtmifyFetchResult> {
      const { baseUrl, token, dashboardId } = readUtmifyEnv();
      if (!baseUrl || !token || !dashboardId) {
        return { ok: false, error: notConfigured() };
      }

      const range = toSaoPauloDayRange(date);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(joinUrl(baseUrl, "/meta-ad-objects"), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dashboardId,
            level: "campaign",
            dateRange: { from: range.fromIso, to: range.toIso },
          }),
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.status === 401 || res.status === 403) {
          return {
            ok: false,
            error: { code: "unauthorized", message: "Credencial da UTMify recusada." },
          };
        }
        if (res.status === 429) {
          return {
            ok: false,
            error: { code: "rate-limited", message: "UTMify aplicou limite de requisições." },
          };
        }
        if (!res.ok) {
          return {
            ok: false,
            error: { code: "unknown", message: `UTMify respondeu ${res.status}.` },
          };
        }

        const payload = (await res.json()) as { results?: unknown[] } | null;
        const rows = mapMetaResults(payload?.results ?? []);
        return { ok: true, day: { date, rows } };
      } catch (err) {
        if (isAbortError(err)) {
          return {
            ok: false,
            error: { code: "timeout", message: "Timeout ao consultar a UTMify." },
          };
        }
        return {
          ok: false,
          error: { code: "network", message: "Falha de rede ao consultar a UTMify." },
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function notConfigured(): UtmifyFetchError {
  return {
    code: "not-configured",
    message:
      "Integração UTMify ainda não configurada. Peça ao administrador para preencher UTMIFY_API_BASE_URL, UTMIFY_API_TOKEN e UTMIFY_DASHBOARD_ID.",
  };
}

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError"
  );
}

// Mapeamento defensivo do payload da Meta para o nosso contrato.
// Aceita apenas o subconjunto de campos que realmente usamos, ignorando o
// resto (evita quebrar por mudanças menores no schema da UTMify).
export function mapMetaResults(results: unknown[]): AdCampaignRow[] {
  const out: AdCampaignRow[] = [];
  for (const raw of results) {
    if (!isRecord(raw)) continue;
    const externalId = strOrNull(raw.campaignId) ?? strOrNull(raw.id);
    const externalAccountId = strOrNull(raw.accountId);
    const name = strOrNull(raw.name);
    if (!externalId || !externalAccountId || !name) continue;

    out.push({
      provider: "meta",
      externalAccountId,
      externalAccountName: strOrNull(raw.ca),
      externalId,
      name,
      status: strOrNull(raw.status) ?? "UNKNOWN",
      spendCents: intOrZero(raw.spend),
      impressions: intOrZero(raw.impressions),
      clicks: intOrZero(raw.inlineLinkClicks),
      landingPageViews: intOrNull(raw.landingPageViews),
      initiateCheckouts: intOrNull(raw.initiateCheckout),
      leads: intOrNull(raw.leads),
      frequency: numOrNull(raw.frequency),
    });
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function intOrZero(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.round(v));
  return 0;
}
function intOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.round(v));
  return null;
}
function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}
