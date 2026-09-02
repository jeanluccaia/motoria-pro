// One-shot: normaliza PagBank XLSX -> JSON no shape v2 do importador
// (payment_status/evidence/migration como first-class, enums UPPERCASE).
// Não loga conteúdo — só metadados agregados.
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import * as XLSX from "xlsx";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("uso: node _normalize-pagbank-xlsx.mjs <in.xlsx> <out.json>");
  process.exit(2);
}

const PLAN_MAP = {
  "Mensal DGN": "Essential",
  "DGN Smart": "Smart",
  "DGN Priority": "Priority",
};

const STATUS_MAP = {
  Ativa: "ACTIVE",
  Cancelada: "CANCELLED",
  Encerrada: "ENDED",
  Pendente: "PENDING",
};

const PAYMENT_METHOD_MAP = {
  "Cartão de crédito": "CARD_RECURRING",
};

const PAYMENT_STATUS_MAP = {
  Concluído: "CONFIRMED",
  Pendente: "PENDING",
  Falhado: "FAILED",
  Estornado: "REFUNDED",
};

function parseAmount(raw) {
  if (raw == null) return 0;
  const cleaned = String(raw)
    .replace(/R\$/i, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  return Number(cleaned);
}

function parseDateBR(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function optOrNull(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^n[aã]o exibido$/i.test(s)) return null;
  return s;
}

const wb = XLSX.read(readFileSync(inPath), { type: "buffer" });
const sheet = wb.Sheets["Contratos ativos"] ?? wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });

const subscriptions = rows.map((row, idx) => {
  const plan = PLAN_MAP[row["Plano"]];
  if (!plan) throw new Error(`Linha ${idx + 1}: plano desconhecido "${row["Plano"]}"`);
  const status = STATUS_MAP[row["Status"]];
  if (!status) throw new Error(`Linha ${idx + 1}: status desconhecido "${row["Status"]}"`);
  const paymentMethod = PAYMENT_METHOD_MAP[row["Meio de pagamento"]] ?? "UNKNOWN";
  const paymentStatus = PAYMENT_STATUS_MAP[row["Status do pagamento"]] ?? "UNKNOWN";

  return {
    provider_subscription_id: String(row["ID da assinatura"]).trim(),
    provider_customer_id: optOrNull(row["ID do cliente PagBank"]),
    customer_name: String(row["Nome do cliente"]).trim(),
    // Telefone/CPF vêm "Não exibido" no snapshot — NUNCA usados como identificador.
    customer_phone: null,
    customer_cpf: null,
    // E-mail mascarado no snapshot — NÃO é identificador confiável.
    customer_email: null,
    plan,
    cycle: "mensal",
    amount_monthly: parseAmount(row["Valor mensal"]),
    status,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    payment_evidence_source: "PROVIDER",
    migration_status: "NOT_NEEDED",
    provider_payment_id: optOrNull(row["ID do último pagamento"]),
    started_at: parseDateBR(row["Assinatura criada em"]),
    next_due_date: parseDateBR(row["Próxima cobrança"]),
    last_payment_confirmed_at: parseDateBR(row["Último pagamento confirmado"]),
    // Snapshot 2026-09-01 NÃO expõe placa. Deixar null — não inventar.
    vehicle_plate: null,
    vehicle_brand: null,
    vehicle_model: null,
    note: optOrNull(row["Observações"]),
  };
});

const totalMonthly = subscriptions.reduce((s, x) => s + x.amount_monthly, 0);
const uniqueCustomers = new Set(subscriptions.map((s) => s.provider_customer_id)).size;

const out = {
  meta: {
    generated_at: new Date().toISOString(),
    source: `PagBank XLSX real (${basename(inPath)})`,
    expected_customers: uniqueCustomers,
    expected_contracts: subscriptions.length,
    expected_total_amount_monthly: totalMonthly,
    snapshot_taken_at: "2026-09-01",
    snapshot_collection_note:
      "Coleta somente de leitura em 01/09/2026. Nenhuma assinatura foi cancelada, alterada ou importada.",
  },
  subscriptions,
};

writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(
  `OK: ${subscriptions.length} contratos, ${uniqueCustomers} customers PagBank únicos, R$ ${totalMonthly.toFixed(2)} mensais.`,
);
console.log(`escrito em: ${outPath}`);
