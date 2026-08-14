import type { EvoReceivable, EvoSaleDetails } from "./types";

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
  "receb",   // "Recebido", "Recebida", "Received"
  "pago",    // "Pago", "Paid"
  "paid",
  "liquidad", // "Liquidado", "Liquidada"
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

  const statusText = normalize(
    (typeof r.status === "string" ? r.status : "") +
      " " +
      (r.statusDescription ?? ""),
  );

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
      paymentType: first?.paymentType ?? null,
      receivableStatus:
        typeof first?.status === "string"
          ? first.status
          : first?.statusDescription ?? null,
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
      paymentType: paidReceivables[0]?.paymentType ?? null,
      receivableStatus:
        typeof paidReceivables[0]?.status === "string"
          ? paidReceivables[0]!.status
          : paidReceivables[0]?.statusDescription ?? null,
      reason: "amount-zero",
    };
  }

  const primary = paidReceivables[0]!;
  return {
    status: "paid",
    amountPaidCents: totalPaidCents,
    receivingDate: primary.receivingDate!,
    paymentType: primary.paymentType ?? null,
    receivableStatus:
      typeof primary.status === "string"
        ? primary.status
        : primary.statusDescription ?? null,
    reason: null,
  };
}
