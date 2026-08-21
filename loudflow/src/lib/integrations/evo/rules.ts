import type {
  EvoEnumLike,
  EvoReceivable,
  EvoSaleDetails,
  EvoSaleItem,
} from "./types";

// A EVO moderna (v2) devolve `status` e `paymentType` como objeto
// `{ id, name }`; versões antigas devolviam string. Aceitamos ambos.
// SEM esses extractors, `evaluatePayment` sempre retornava pending
// para vendas reais (bug pré-existente, corrigido em 2026-08-18).
export function extractStatusName(r: EvoReceivable): string {
  if (typeof r.status === "string") return r.status;
  if (typeof r.status === "number") return String(r.status);
  if (r.status && typeof r.status === "object") {
    const enumLike = r.status as EvoEnumLike;
    if (typeof enumLike.name === "string") return enumLike.name;
  }
  return r.statusDescription ?? "";
}

export function extractPaymentTypeName(r: EvoReceivable): string | null {
  if (typeof r.paymentType === "string" && r.paymentType.length > 0) {
    return r.paymentType;
  }
  if (r.paymentType && typeof r.paymentType === "object") {
    const enumLike = r.paymentType as EvoEnumLike;
    if (typeof enumLike.name === "string" && enumLike.name.length > 0) {
      return enumLike.name;
    }
  }
  return null;
}

// Regra única de "venda paga" — usada tanto pelo webhook quanto por
// scripts de reprocesso. Alterar aqui muda a definição de conversão
// paga no Loud Flow inteiro.
//
// Uma venda é considerada PAGA se, e somente se:
//   1. `removed` NÃO é true;
//   2. existe ao menos um recebível confirmado;
//   3. `ammountPaid` do recebível confirmado (ou o total da venda) > 0;
//   4. o recebível confirmado tem `receivingDate` preenchida;
//   5. o `status` do recebível representa recebimento concreto (não
//      "aguardando pagamento" / "vencido" / "cancelado").
//
// Pix / boleto gerados mas ainda não pagos NÃO viram conversão — a EVO
// só popula receivingDate e o status "recebido" após conciliação.
//
// Estados possíveis (retornados pela função):
//   * paid       — respeita as 5 condições
//   * cancelled  — sale.removed === true
//   * pending    — venda existe, mas o(s) recebível(is) ainda não bateram
//                  os requisitos (aguardando pagamento / vencido / etc.)
//   * unknown    — payload sem campos suficientes para decidir; a rota
//                  registra como pending para reprocesso posterior.

export type PaymentEvaluation =
  | {
      status: "paid";
      amountPaidCents: number;
      receivingDate: string;
      paymentType: string | null;
      receivableStatus: string | null;
      reason: null;
    }
  | {
      status: "cancelled";
      amountPaidCents: number;
      receivingDate: string | null;
      paymentType: string | null;
      receivableStatus: string | null;
      reason: string;
    }
  | {
      status: "pending" | "unknown";
      amountPaidCents: number;
      receivingDate: string | null;
      paymentType: string | null;
      receivableStatus: string | null;
      reason: string;
    };

// Palavras-chave que caracterizam "recebido de fato" em qualquer idioma
// / grafia observada nas contas EVO. A checagem é case-insensitive e
// ignora acentos. A ausência dessas palavras (mesmo com receivingDate
// preenchida) mantém a venda como pending — evita contar boleto que
// gerou receivingDate futura mas nunca foi liquidado.
const RECEIVED_KEYWORDS = [
  "receb",     // "Recebido", "Recebida"
  "receiv",    // "Received", "Receiving" — inglês (observado na EVO v2: status.name="received")
  "pago",      // "Pago"
  "paid",
  "liquidad",  // "Liquidado", "Liquidada"
  "conciliad", // "Conciliado"
  "settled",
] as const;

// Palavras-chave que caracterizam cancelamento explícito do recebível.
const CANCELLED_KEYWORDS = ["cancel", "estorn", "refund", "chargeback"] as const;

function normalize(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  if (!haystack) return false;
  return needles.some((n) => haystack.includes(n));
}

function toCents(amount: number | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  if (!Number.isFinite(amount)) return 0;
  // EVO devolve valores como decimal (ex.: 149.90). Convertemos com
  // arredondamento clássico para evitar centavo perdido por float.
  return Math.round(amount * 100);
}

function pickReceivableAmount(r: EvoReceivable): number {
  // A EVO usa `ammountPaid` (com dois M) na maioria dos endpoints; em
  // versões novas aparece `amountPaid`. Preferimos o valor não-nulo.
  if (typeof r.ammountPaid === "number") return r.ammountPaid;
  if (typeof r.amountPaid === "number") return r.amountPaid;
  return 0;
}

function pickSaleAmount(sale: EvoSaleDetails): number {
  if (typeof sale.ammountPaid === "number") return sale.ammountPaid;
  if (typeof sale.amountPaid === "number") return sale.amountPaid;
  return 0;
}

// Recebível é "válido/pago" quando:
//   - amount > 0
//   - tem receivingDate preenchida (string não-vazia)
//   - status/description indica recebimento e NÃO indica cancelamento
function isReceivablePaid(r: EvoReceivable): boolean {
  const amount = pickReceivableAmount(r);
  if (amount <= 0) return false;
  if (!r.receivingDate || String(r.receivingDate).trim().length === 0) return false;

  const statusText = normalize(extractStatusName(r));

  // Status numérico só (ex.: 1, 2, 3) — sem descrição textual: só considera
  // paga se houver receivingDate + amount > 0. Regra conservadora para não
  // depender de mapeamento numérico desconhecido; a EVO na prática sempre
  // envia texto quando o recebível é liquidado.
  if (!statusText) {
    // Sem texto, exigimos ao menos uma pista clara: paymentType Pix/Boleto
    // sem status textual costuma ser "aguardando pagamento" — devolvemos
    // false para forçar reprocesso quando a EVO enriquecer a resposta.
    return false;
  }

  if (includesAny(statusText, CANCELLED_KEYWORDS)) return false;
  return includesAny(statusText, RECEIVED_KEYWORDS);
}

export function evaluatePayment(sale: EvoSaleDetails): PaymentEvaluation {
  if (sale.removed === true) {
    return {
      status: "cancelled",
      amountPaidCents: 0,
      receivingDate: null,
      paymentType: null,
      receivableStatus: null,
      reason: "sale.removed=true",
    };
  }

  const receivables = Array.isArray(sale.receivables) ? sale.receivables : [];

  if (receivables.length === 0) {
    return {
      status: "pending",
      amountPaidCents: toCents(pickSaleAmount(sale)),
      receivingDate: null,
      paymentType: null,
      receivableStatus: null,
      reason: "no-receivables",
    };
  }

  const paidReceivables = receivables.filter(isReceivablePaid);

  if (paidReceivables.length === 0) {
    // Detalhe informativo do primeiro recebível para debug (payment type
    // aparece na tabela para orientar reprocesso).
    const first = receivables[0];
    return {
      status: "pending",
      amountPaidCents: toCents(pickSaleAmount(sale)),
      receivingDate: null,
      paymentType: first ? extractPaymentTypeName(first) : null,
      receivableStatus: first ? extractStatusName(first) || null : null,
      reason: "no-paid-receivable",
    };
  }

  const totalPaidCents = paidReceivables.reduce(
    (acc, r) => acc + toCents(pickReceivableAmount(r)),
    0,
  );

  if (totalPaidCents <= 0) {
    return {
      status: "pending",
      amountPaidCents: 0,
      receivingDate: null,
      paymentType: paidReceivables[0] ? extractPaymentTypeName(paidReceivables[0]) : null,
      receivableStatus: paidReceivables[0] ? extractStatusName(paidReceivables[0]) || null : null,
      reason: "amount-zero",
    };
  }

  const primary = paidReceivables[0]!;
  return {
    status: "paid",
    amountPaidCents: totalPaidCents,
    receivingDate: primary.receivingDate!,
    paymentType: extractPaymentTypeName(primary),
    receivableStatus: extractStatusName(primary) || null,
    reason: null,
  };
}

// ============================================================
// Classificador de elegibilidade de conversão
// ============================================================
//
// A EVO devolve na listagem todo tipo de venda — matrícula nova,
// renovação, produto avulso (garrafa, camiseta), serviço avulso
// (dayuse, avaliação). Só matrícula NOVA vale como conversão de
// mídia (Meta CAPI / Google Ads Enhanced Conversions).
//
// Esta função devolve `included` ou `excluded` com uma reason
// auditável (persistida em evo_sales.last_reason e logada nos
// contadores do cron). NUNCA lança.
//
// Regras de inclusão (todas obrigatórias):
//   1. venda não está `removed`
//   2. evaluatePayment(sale).status === 'paid'
//   3. `registrationKind` não é 'renewal' (quando presente)
//   4. existe ao menos um item em saleItens com idMembership OU
//      idMemberMembership presentes
//   5. nenhum item com idMembershipRenewed (indica renovação
//      mesmo quando registrationKind vem ausente)
//
// Regras de exclusão (retornadas em ordem — a primeira que bater
// é o motivo persistido):
//   - 'cancelled'          → sale.removed === true
//   - 'not-paid'           → evaluatePayment != paid
//   - 'renewal'            → registrationKind='renewal' OU item com idMembershipRenewed
//   - 'product-only'       → todo item tem idProduct
//   - 'service-only'       → todo item tem idService
//   - 'no-membership'      → nenhum item de matrícula
export type EvoIncludeReason = null;
export type EvoExcludeReason =
  | "cancelled"
  | "not-paid"
  | "renewal"
  | "product-only"
  | "service-only"
  | "no-membership";

export type SaleClassification =
  | { eligible: true; reason: EvoIncludeReason }
  | { eligible: false; reason: EvoExcludeReason };

function extractItems(sale: EvoSaleDetails): EvoSaleItem[] {
  if (Array.isArray(sale.saleItens)) return sale.saleItens;
  if (Array.isArray(sale.saleItems)) return sale.saleItems;
  if (Array.isArray(sale.items)) return sale.items;
  return [];
}

function extractRegistrationKind(sale: EvoSaleDetails): string {
  const raw = sale.registrationKind ?? sale.registrationType ?? null;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const enumLike = raw as EvoEnumLike;
    if (typeof enumLike.name === "string") return enumLike.name;
  }
  return "";
}

function hasNonEmptyId(v: number | string | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  return v.trim().length > 0;
}

export function classifySale(sale: EvoSaleDetails): SaleClassification {
  if (sale.removed === true) {
    return { eligible: false, reason: "cancelled" };
  }

  const payment = evaluatePayment(sale);
  if (payment.status !== "paid") {
    return { eligible: false, reason: "not-paid" };
  }

  const kind = normalize(extractRegistrationKind(sale));
  // 'renewal' | 'renovacao' | 'renovation' — normalizações observadas.
  if (kind.includes("renew") || kind.includes("renov")) {
    return { eligible: false, reason: "renewal" };
  }

  const items = extractItems(sale);

  // idMembershipRenewed presente em qualquer item = renovação, mesmo
  // que registrationKind não venha marcado. É o sinal mais confiável
  // porque é um FK direto do próprio banco da EVO.
  const anyRenewedItem = items.some((it) => hasNonEmptyId(it.idMembershipRenewed));
  if (anyRenewedItem) {
    return { eligible: false, reason: "renewal" };
  }

  const membershipItems = items.filter(
    (it) => hasNonEmptyId(it.idMembership) || hasNonEmptyId(it.idMemberMembership),
  );
  if (membershipItems.length > 0) {
    return { eligible: true, reason: null };
  }

  // Sem matrícula na venda — decide o motivo mais específico para o log.
  const anyProduct = items.some((it) => hasNonEmptyId(it.idProduct));
  const anyService = items.some((it) => hasNonEmptyId(it.idService));
  if (items.length > 0 && anyProduct && !anyService) {
    return { eligible: false, reason: "product-only" };
  }
  if (items.length > 0 && anyService && !anyProduct) {
    return { eligible: false, reason: "service-only" };
  }
  return { eligible: false, reason: "no-membership" };
}
