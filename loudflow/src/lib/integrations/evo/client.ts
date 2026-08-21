import type {
  EvoClient,
  EvoFetchError,
  EvoFetchResult,
  EvoListSalesParams,
  EvoListSalesResult,
  EvoMemberContact,
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
      if (!result.ok) return { ok: false, error: await classifyErrorResponse(result) };

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
      // Rota /api/v2/members/{idMember} confirmada pela EVO como a
      // oficial em 2026-08 (a v1 devolvia 404 nas credenciais atuais e
      // travava o enriquecimento — bug corrigido nesta migração).
      const url = `${base}/api/v2/members/${safeMember}`;

      const result = await fetchWithTimeout(url);
      if (!(result instanceof Response)) return { ok: false, error: result };
      if (!result.ok) return { ok: false, error: await classifyErrorResponse(result) };

      const payload = (await result.json()) as EvoMemberDetails | EvoMemberDetails[];
      const raw = Array.isArray(payload) ? payload[0] ?? {} : payload;
      const member = normalizeMember(raw);
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
      // onlyMembership=true filtra vendas de produto/serviço no lado
      // da EVO — reduz tráfego e concentra em matrículas (o único
      // universo que queremos enviar como conversão).
      if (params.onlyMembership) qs.set("onlyMembership", "true");
      const url = `${base}/api/v2/sales?${qs.toString()}`;

      const result = await fetchWithTimeout(url);
      if (!(result instanceof Response)) return { ok: false, error: result };
      if (!result.ok) return { ok: false, error: await classifyErrorResponse(result) };

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

// Classifica a resposta de erro da EVO. Precisa ser async porque a EVO
// devolve HTTP 401 em DOIS cenários semanticamente diferentes:
//   (a) credencial ruim → { code: "unauthorized" }
//   (b) rate limit diário estourado → { code: "rate-limited" }
// A distinção só é possível lendo o body:
//   {"status":401,"error":"Daily request limit reached. Upgrade to API Pro to get unlimited requests."}
// Ambos são 401, mas o handler a jusante trata rate-limited abortando
// TODO o processamento (não faz sentido continuar; próximas chamadas
// também falharão até o reset diário). Ver reconcile.ts.
async function classifyErrorResponse(res: Response): Promise<EvoFetchError> {
  const status = res.status;
  let body = "";
  try {
    body = await res.text();
  } catch {
    /* ignora — sem body a classificação cai no caminho por status */
  }
  if (status === 401 || status === 403) {
    if (isRateLimitBody(body)) {
      return {
        code: "rate-limited",
        message: "EVO rate limit diário estourado (HTTP 401 'Daily request limit reached').",
      };
    }
    return { code: "unauthorized", message: `EVO recusou o Basic Auth (HTTP ${status}).` };
  }
  return classifyStatus(status);
}

function isRateLimitBody(body: string): boolean {
  if (!body) return false;
  return /daily\s+request\s+limit\s+reached/i.test(body);
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

// Normaliza o payload cru do endpoint v2/members para o shape que o
// resto do sistema espera. A EVO devolve o email/telefone dentro de
// contacts[] (contactType='E-mail'/'Cellphone' com valor em description);
// alguns tenants antigos ainda devolvem `email`/`cellphone` direto no
// objeto. Priorizamos os campos diretos e caímos em contacts como
// fallback — mantém o buildCustomer do deliver simples.
//
// Também normaliza name/firstName/lastName usando registerName/registerLastName
// como último fallback (observado em contas onde firstName vem vazio).
function normalizeMember(raw: EvoMemberDetails): EvoMemberDetails {
  const contacts = Array.isArray(raw.contacts) ? raw.contacts : null;
  const email =
    firstNonEmpty(raw.email) ??
    (contacts ? pickContactValue(contacts, "email") : null);
  const cellphone =
    firstNonEmpty(raw.cellphone) ??
    firstNonEmpty(raw.phone) ??
    (contacts ? pickContactValue(contacts, "cellphone") : null);
  const firstName =
    firstNonEmpty(raw.firstName) ??
    firstNonEmpty(raw.registerName) ??
    splitFirstFromFullName(raw.name);
  const lastName =
    firstNonEmpty(raw.lastName) ??
    firstNonEmpty(raw.registerLastName) ??
    splitLastFromFullName(raw.name);
  return {
    ...raw,
    firstName,
    lastName,
    email,
    cellphone,
    phone: cellphone ?? firstNonEmpty(raw.phone) ?? null,
    contacts,
  };
}

function firstNonEmpty(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickContactValue(
  contacts: EvoMemberContact[],
  kind: "email" | "cellphone",
): string | null {
  for (const c of contacts) {
    const raw = (c?.contactType ?? "").toString().toLowerCase();
    const isEmail = raw.includes("mail");
    const isCell = raw.includes("phone") || raw.includes("cell");
    if ((kind === "email" && isEmail) || (kind === "cellphone" && isCell)) {
      const desc = firstNonEmpty(c?.description ?? null);
      if (desc) return desc;
    }
  }
  return null;
}

function splitFirstFromFullName(name: string | null | undefined): string | null {
  const full = firstNonEmpty(name ?? null);
  if (!full) return null;
  const [first] = full.split(/\s+/);
  return first ?? null;
}

function splitLastFromFullName(name: string | null | undefined): string | null {
  const full = firstNonEmpty(name ?? null);
  if (!full) return null;
  const parts = full.split(/\s+/);
  if (parts.length < 2) return null;
  return parts.slice(1).join(" ");
}

// Remove qualquer resíduo de credencial (Basic/Bearer) das mensagens.
function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  return raw
    .replace(/Basic\s+[A-Za-z0-9+/=]+/g, "Basic ***")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer ***")
    .slice(0, 500);
}
