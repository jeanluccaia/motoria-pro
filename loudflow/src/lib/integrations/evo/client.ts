import type {
  EvoClient,
  EvoFetchError,
  EvoFetchResult,
  EvoSaleDetails,
} from "./types";
import {
  getEvoApiBaseUrl,
  getMissingEvoEnvs,
  evoUnavailableReason,
} from "./env";

// Cliente HTTP server-to-server para o endpoint da EVO / W12.
//
// Rota consultada: GET /api/v2/sales/{IdRecord}?showReceivables=true
// Autenticação:    Basic Auth com EVO_API_USERNAME / EVO_API_PASSWORD
//
// Nunca chamado no navegador: Basic com credenciais permanentes; qualquer
// exposição em client bundle vaza acesso a dados de aluno da EVO.
//
// Mensagens de erro são sanitizadas (nunca vaza Bearer/Basic ou url com
// query sensível).

const DEFAULT_TIMEOUT_MS = 30_000;

type ClientOptions = {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

export function createEvoClient(options: ClientOptions = {}): EvoClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const doFetch = options.fetchImpl ?? fetch;
  const missing = getMissingEvoEnvs();
  const configured = missing.length === 0;

  return {
    isConfigured: () => configured,
    async fetchSale(idBranch: string, idSale: string): Promise<EvoFetchResult> {
      if (!configured) {
        return {
          ok: false,
          error: { code: "not-configured", message: evoUnavailableReason() },
        };
      }

      const base = options.baseUrl ?? getEvoApiBaseUrl();
      const username = process.env.EVO_API_USERNAME!;
      const password = process.env.EVO_API_PASSWORD!;
      const auth = Buffer.from(`${username}:${password}`, "utf8").toString("base64");

      const safeSaleId = encodeURIComponent(idSale);
      // IdBranch entra apenas como filtro auxiliar quando a instalação EVO
      // for multi-branch; o endpoint aceita idBranch como query, ignora se
      // não houver colisão de idRecord entre branches (padrão observado).
      const safeBranch = encodeURIComponent(idBranch);
      const url = `${base}/api/v2/sales/${safeSaleId}?showReceivables=true&idBranch=${safeBranch}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await doFetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            accept: "application/json",
            authorization: `Basic ${auth}`,
          },
        });

        if (!res.ok) {
          return { ok: false, error: classifyStatus(res.status) };
        }

        const payload = (await res.json()) as EvoSaleDetails | EvoSaleDetails[];
        // A EVO ocasionalmente devolve array com um único elemento quando
        // a rota é usada em modo listagem — normalizamos aqui.
        const sale = Array.isArray(payload) ? payload[0] ?? {} : payload;
        return { ok: true, sale };
      } catch (err) {
        return { ok: false, error: classifyThrown(err) };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function classifyStatus(status: number): EvoFetchError {
  if (status === 401 || status === 403) {
    return { code: "unauthorized", message: `EVO recusou o Basic Auth (HTTP ${status}).` };
  }
  if (status === 404) {
    return { code: "not-found", message: `EVO não encontrou a venda (HTTP 404).` };
  }
  if (status === 429) {
    return { code: "rate-limited", message: `EVO limitou a chamada (HTTP 429).` };
  }
  if (status >= 500) {
    return { code: "network", message: `EVO respondeu HTTP ${status} (servidor).` };
  }
  return { code: "unknown", message: `Resposta inesperada da EVO (HTTP ${status}).` };
}

function classifyThrown(err: unknown): EvoFetchError {
  const message = sanitizeError(err);
  if (err instanceof Error && err.name === "AbortError") {
    return { code: "timeout", message: "Timeout ao consultar a EVO." };
  }
  return { code: "network", message };
}

// Remove qualquer resíduo de credencial (Basic/Bearer) das mensagens.
function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  return raw
    .replace(/Basic\s+[A-Za-z0-9+/=]+/g, "Basic ***")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer ***")
    .slice(0, 500);
}
