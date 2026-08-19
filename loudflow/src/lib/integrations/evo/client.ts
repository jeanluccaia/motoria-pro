import type {
  EvoClient,
  EvoFetchError,
  EvoFetchResult,
  EvoListSalesParams,
  EvoListSalesResult,
  EvoMemberDetails,
  EvoMemberFetchResult,
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

  function buildAuthHeader(): string {
    const username = process.env.EVO_API_USERNAME!;
    const password = process.env.EVO_API_PASSWORD!;
    return "Basic " + Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  }

  async function fetchWithTimeout(url: string): Promise<Response | EvoFetchError> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await doFetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          accept: "application/json",
          authorization: buildAuthHeader(),
        },
      });
    } catch (err) {
      return classifyThrown(err);
    } finally {
      clearTimeout(timer);
    }
  }

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
      const safeSaleId = encodeURIComponent(idSale);
      // IdBranch entra apenas como filtro auxiliar quando a instalação EVO
      // for multi-branch; o endpoint aceita idBranch como query, ignora se
      // não houver colisão de idRecord entre branches (padrão observado).
      const safeBranch = encodeURIComponent(idBranch);
      const url = `${base}/api/v2/sales/${safeSaleId}?showReceivables=true&idBranch=${safeBranch}`;

      const result = await fetchWithTimeout(url);
      if (!(result instanceof Response)) return { ok: false, error: result };
      if (!result.ok) return { ok: false, error: classifyStatus(result.status) };

      const payload = (await result.json()) as EvoSaleDetails | EvoSaleDetails[];
      // A EVO ocasionalmente devolve array com um único elemento quando
      // a rota é usada em modo listagem — normalizamos aqui.
      const sale = Array.isArray(payload) ? payload[0] ?? {} : payload;
      return { ok: true, sale };
    },
    async fetchMember(idMember: string): Promise<EvoMemberFetchResult> {
      if (!configured) {
        return {
          ok: false,
          error: { code: "not-configured", message: evoUnavailableReason() },
        };
      }

      const base = options.baseUrl ?? getEvoApiBaseUrl();
      const safeMember = encodeURIComponent(idMember);
      // Rota /api/v1/members/{id} é o padrão observado (v1) da API W12 para
      // dados do aluno. Se a instalação usar outra versão (v2/v3) ou não
      // permitir esse endpoint com as credenciais atuais, o retorno será
      // 404/401 e o delivery a jusante marca `skipped` — o webhook e o
      // registro em evo_sales seguem normais.
      const url = `${base}/api/v1/members/${safeMember}`;

      const result = await fetchWithTimeout(url);
      if (!(result instanceof Response)) return { ok: false, error: result };
      if (!result.ok) return { ok: false, error: classifyStatus(result.status) };

      const payload = (await result.json()) as EvoMemberDetails | EvoMemberDetails[];
      const member = Array.isArray(payload) ? payload[0] ?? {} : payload;
      return { ok: true, member };
    },
    async listSales(params: EvoListSalesParams): Promise<EvoListSalesResult> {
      if (!configured) {
        return {
          ok: false,
          error: { code: "not-configured", message: evoUnavailableReason() },
        };
      }
      const base = options.baseUrl ?? getEvoApiBaseUrl();
      const qs = new URLSearchParams({
        showReceivables: "true",
        updatedReceivableStartDate: params.updatedReceivableStartDate,
        updatedReceivableEndDate: params.updatedReceivableEndDate,
        take: String(params.take ?? 100),
        skip: String(params.skip ?? 0),
      });
      if (params.idBranch) qs.set("idBranch", params.idBranch);
      const url = `${base}/api/v2/sales?${qs.toString()}`;

      const result = await fetchWithTimeout(url);
      if (!(result instanceof Response)) return { ok: false, error: result };
      if (!result.ok) return { ok: false, error: classifyStatus(result.status) };

      const payload = (await result.json()) as EvoSaleDetails[] | { data?: EvoSaleDetails[]; result?: EvoSaleDetails[] };
      // Endpoint devolve Array<Sale> direto (2026-08-18). Aceita envelope
      // {data|result: [...]} defensivamente por variação futura.
      let sales: EvoSaleDetails[] = [];
      if (Array.isArray(payload)) sales = payload;
      else if (Array.isArray(payload?.data)) sales = payload.data;
      else if (Array.isArray(payload?.result)) sales = payload.result;
      return { ok: true, sales };
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
