import "server-only";

import {
  DEFAULT_UTMIFY_ORDERS_PATH,
  getUtmifyOrdersUrl,
  isUtmifyOrdersConfigured,
} from "./env";

// Cliente HTTP server-to-server para o endpoint OFICIAL da UTMify:
//   POST https://api.utmify.com.br/api-credentials/orders
//   header: x-api-token
//
// Ao receber uma order 'paid', a UTMify:
//   * registra a venda no dashboard dela;
//   * encaminha o evento Purchase para Meta CAPI e Google Ads Enhanced
//     Conversions (quando essas integrações estão ligadas no painel).
//
// Portanto o Loud Flow envia UMA única chamada por venda paga; a UTMify
// faz o fan-out. Dedup por orderId — nunca enviamos duas vezes para o
// mesmo (id_branch, id_sale). Ver `ad_conversion_deliveries`.
//
// Segurança:
//   * token EXCLUSIVAMENTE server-side (não usa NEXT_PUBLIC_).
//   * mensagens de erro sanitizadas (nunca vazam token / e-mail / phone).
//   * `isTest: true` em Preview e local (VERCEL_ENV !== 'production').

const DEFAULT_TIMEOUT_MS = 15_000;

export type UtmifyOrderPaymentMethod =
  | "credit_card"
  | "boleto"
  | "pix"
  | "paypal"
  | "free_price";

export type UtmifyOrderStatus =
  | "waiting_payment"
  | "paid"
  | "refused"
  | "refunded"
  | "chargedback";

export type UtmifyOrderCustomer = {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  country?: string | null;
  ip?: string | null;
};

export type UtmifyOrderProduct = {
  id: string;
  name: string;
  planId?: string | null;
  planName?: string | null;
  quantity: number;
  priceInCents: number;
};

export type UtmifyOrderTrackingParameters = {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

export type UtmifyOrderCommission = {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency: "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD" | "COP" | "MXN" | "PYG" | "CLP" | "PEN" | "PLN";
};

export type UtmifyOrderPayload = {
  orderId: string;
  platform: string;              // PascalCase — usamos "LoudFlow"
  paymentMethod: UtmifyOrderPaymentMethod;
  status: UtmifyOrderStatus;
  createdAt: string;             // "YYYY-MM-DD HH:MM:SS" em UTC
  approvedDate: string | null;   // idem, null se não pago
  refundedAt: string | null;     // idem, null se não estornado
  customer: UtmifyOrderCustomer;
  products: UtmifyOrderProduct[];
  trackingParameters: UtmifyOrderTrackingParameters;
  commission: UtmifyOrderCommission;
  isTest?: boolean;              // valida sem gravar quando true
};

export type UtmifyOrdersError = {
  code:
    | "not-configured"
    | "unauthorized"
    | "rate-limited"
    | "timeout"
    | "network"
    | "invalid-response"
    | "server-rejected";
  message: string;
  httpStatus?: number;
};

export type UtmifyOrdersResult =
  | { ok: true; status: number; responseSummary: string }
  | { ok: false; error: UtmifyOrdersError };

export type UtmifyOrdersClient = {
  isConfigured(): boolean;
  sendOrder(payload: UtmifyOrderPayload): Promise<UtmifyOrdersResult>;
};

type ClientOptions = {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

export function createUtmifyOrdersClient(options: ClientOptions = {}): UtmifyOrdersClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const doFetch = options.fetchImpl ?? fetch;
  const configured = isUtmifyOrdersConfigured();

  return {
    isConfigured: () => configured,
    async sendOrder(payload: UtmifyOrderPayload): Promise<UtmifyOrdersResult> {
      if (!configured) {
        return {
          ok: false,
          error: {
            code: "not-configured",
            message:
              "UTMify orders indisponível: defina UTMIFY_ORDERS_API_TOKEN no ambiente do servidor.",
          },
        };
      }

      const token = process.env.UTMIFY_ORDERS_API_TOKEN!;
      const url = options.baseUrl
        ? `${options.baseUrl.replace(/\/+$/, "")}${DEFAULT_UTMIFY_ORDERS_PATH}`
        : getUtmifyOrdersUrl();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await doFetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            "x-api-token": token,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          return {
            ok: true,
            status: res.status,
            responseSummary: await summarizeResponse(res),
          };
        }
        return { ok: false, error: await classifyErrorResponse(res) };
      } catch (err) {
        return { ok: false, error: classifyThrown(err) };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

// -------- helpers -----------------------------------------------------

async function summarizeResponse(res: Response): Promise<string> {
  // Só um trecho curto e sanitizado; nunca guardar payload completo (pode
  // conter e-mail / phone se a UTMify ecoar).
  try {
    const text = await res.text();
    if (!text) return `HTTP ${res.status}`;
    return `HTTP ${res.status} :: ${sanitizeText(text).slice(0, 240)}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function classifyErrorResponse(res: Response): Promise<UtmifyOrdersError> {
  const httpStatus = res.status;
  let excerpt = "";
  try {
    excerpt = sanitizeText(await res.text()).slice(0, 240);
  } catch {
    /* ignora — sanitize suficiente */
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      code: "unauthorized",
      httpStatus,
      message: `UTMify recusou o x-api-token (HTTP ${httpStatus}).`,
    };
  }
  if (httpStatus === 429) {
    return {
      code: "rate-limited",
      httpStatus,
      message: `UTMify limitou a chamada (HTTP 429).`,
    };
  }
  if (httpStatus >= 500) {
    return {
      code: "server-rejected",
      httpStatus,
      message: `UTMify respondeu HTTP ${httpStatus}${excerpt ? ` :: ${excerpt}` : ""}`,
    };
  }
  return {
    code: "invalid-response",
    httpStatus,
    message: `UTMify recusou o payload (HTTP ${httpStatus})${excerpt ? ` :: ${excerpt}` : ""}`,
  };
}

function classifyThrown(err: unknown): UtmifyOrdersError {
  const message = sanitizeError(err);
  if (err instanceof Error && err.name === "AbortError") {
    return { code: "timeout", message: "Timeout ao chamar UTMify orders." };
  }
  return { code: "network", message };
}

// Remove qualquer resíduo de credencial e mascara padrões parecidos com
// e-mail e telefone (defensivo — a UTMify não deveria ecoar, mas se ecoar
// nunca vaza nos logs).
function sanitizeText(raw: string): string {
  return raw
    .replace(/x-api-token[^,\s"]*/gi, "x-api-token ***")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer ***")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "***@***")
    .replace(/\b\+?\d[\d\s().-]{8,}\b/g, "***phone***");
}

function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  return sanitizeText(raw).slice(0, 500);
}

// Utilitário exportado para os testes montarem payload mínimo.
export function formatUtcDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}
