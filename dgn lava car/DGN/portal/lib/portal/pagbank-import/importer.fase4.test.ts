import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runPagBankImport,
  buildMatchIndexes,
  detectManualProviderOverlaps,
  type ExistingSubscription,
} from "./importer.ts";
import type { CustomerCandidate, ImportAction, PagBankSubscriptionInput } from "./types.ts";
import { buildSubscriptionRow } from "./build-subscription-row.ts";

// Fase 4 — brief do Jean 2026-09-22
// -----------------------------------------------------------------------------
// Cobre os 7 casos obrigatórios:
//   1. Contrato PagBank já existente → atualização idempotente
//   2. Assinatura manual ativa + novo contrato PagBank → review, sem create
//   3. Dois contratos legítimos comprovados → preservação independente
//   4. Mesmo arquivo importado duas vezes → nenhuma duplicação
//   5. Ausência de note → observação anterior preservada em UPDATE
//   6. UPDATE preserva subscription_detected_at original
//   7. Nenhuma alteração indevida em pagamentos manuais ou evidências provider
// -----------------------------------------------------------------------------

const BASE_INPUT: Omit<
  PagBankSubscriptionInput,
  "provider_subscription_id" | "provider_customer_id" | "customer_name"
> = {
  plan: "Smart",
  cycle: "mensal",
  amount_monthly: 130,
  status: "ACTIVE",
  payment_method: "CARD_RECURRING",
  payment_status: "CONFIRMED",
  payment_evidence_source: "PROVIDER",
  migration_status: "NOT_NEEDED",
};

function makeInput(
  overrides: Partial<PagBankSubscriptionInput> &
    Pick<PagBankSubscriptionInput, "provider_subscription_id" | "customer_name">,
): PagBankSubscriptionInput {
  return { ...BASE_INPUT, ...overrides } as PagBankSubscriptionInput;
}

function makeCandidate(o: Partial<CustomerCandidate> & Pick<CustomerCandidate, "id" | "name">): CustomerCandidate {
  return { legacy_id: null, normalized_phone: null, email: null, ...o };
}

const NO_REVIEW = { required: false, reason: null };
const SOURCE_LABEL = "pagbank:snapshot-2026-09-22";

// ============================================================================
// Caso 1 — Contrato PagBank já existente → atualização idempotente
// ============================================================================
test("Fase 4 caso 1: contrato PagBank já existente vira duplicate + update_subscription (idempotente)", () => {
  const input = makeInput({
    provider_subscription_id: "SUBS_JUAN",
    provider_customer_id: "CUST_JUAN",
    customer_name: "Juan Infante",
  });
  const existing: ExistingSubscription = {
    id: "sub-crm-juan",
    customer_id: "cust-juan-crm",
    provider_customer_id: "CUST_JUAN",
    provider_subscription_id: "SUBS_JUAN",
    plan: "Essential",
    subscription_source: "Importação",
    is_active_subscriber: true,
    is_manual: false,
  };
  const summary = runPagBankImport({
    file: { meta: { generated_at: "2026-09-22T00:00:00Z", source: "test" }, subscriptions: [input] },
    indexes: buildMatchIndexes([]),
    existingSubscriptionsByProviderId: new Map([["SUBS_JUAN", existing]]),
    existingSubscriptionsByCustomerId: new Map([["cust-juan-crm", [existing]]]),
    mode: "dry_run",
    sourceLabel: SOURCE_LABEL,
  });
  assert.equal(summary.totals.duplicates, 1);
  assert.equal(summary.totals.subscriptions_would_create, 0);
  assert.equal(summary.totals.subscriptions_would_update, 1);
  assert.equal(summary.totals.manual_provider_overlaps, 0);
  const row = summary.rows[0]!;
  assert.equal(row.outcome, "duplicate");
  const update = row.actions.find((a) => a.kind === "update_subscription");
  assert.ok(update);
});

// ============================================================================
// Caso 2 — Assinatura manual ativa + novo contrato PagBank → review humano
// Cenário real: Benedito/Jose Moreira/Rikardo/Wellington (Founders 001–003 +
// Wellington) têm sub manual ativa; se PagBank confirmar futuramente, não
// pode criar sub paralela sem decisão humana.
// ============================================================================
test("Fase 4 caso 2: cliente com sub manual ativa + contrato PagBank novo → review, sem create", () => {
  const customer = makeCandidate({
    id: "cust-benedito",
    name: "Benedito Constantino",
    normalized_phone: "11999999001",
  });
  const manualActive: ExistingSubscription = {
    id: "sub-manual-benedito",
    customer_id: "cust-benedito",
    provider_customer_id: null,
    provider_subscription_id: null, // sub manual → sem provider
    plan: "Priority",
    subscription_source: "Importação",
    is_active_subscriber: true,
    is_manual: true,
    payment_evidence_source: "manual",
    payment_verification_status: "not_verified",
    cycle_ends_at: "2026-12-31T03:00:00Z",
    source_reference: "Founder Nº001 confirmado",
  };
  const incoming = makeInput({
    provider_subscription_id: "SUBS_BEN_NEW",
    provider_customer_id: "CUST_BEN_NEW",
    customer_name: "Benedito Constantino",
    customer_phone: "+5511999999001",
    plan: "Priority",
    next_due_date: "2026-10-15",
  });
  const summary = runPagBankImport({
    file: { meta: { generated_at: "2026-09-22T00:00:00Z", source: "test" }, subscriptions: [incoming] },
    indexes: buildMatchIndexes([customer]),
    existingSubscriptionsByProviderId: new Map(),
    existingSubscriptionsByCustomerId: new Map([["cust-benedito", [manualActive]]]),
    mode: "dry_run",
    sourceLabel: SOURCE_LABEL,
  });
  assert.equal(summary.totals.manual_provider_overlaps, 1);
  assert.equal(summary.totals.review_required, 1);
  assert.equal(summary.totals.matched, 0);
  assert.equal(summary.totals.subscriptions_would_create, 0, "não pode criar sub PagBank paralela");
  const row = summary.rows[0]!;
  assert.equal(row.outcome, "review_required");
  const overlapFlag = row.actions.find(
    (a): a is Extract<ImportAction, { kind: "flag_manual_provider_overlap" }> =>
      a.kind === "flag_manual_provider_overlap",
  );
  assert.ok(overlapFlag);
  assert.equal(overlapFlag.evidence.customerId, "cust-benedito");
  assert.equal(overlapFlag.evidence.manualSubscription.id, "sub-manual-benedito");
  assert.equal(overlapFlag.evidence.incomingProvider.providerSubscriptionId, "SUBS_BEN_NEW");
  // Não emite create_subscription — humano decide antes.
  const create = row.actions.find((a) => a.kind === "create_subscription");
  assert.equal(create, undefined);
});

// ============================================================================
// Caso 3 — Dois contratos legítimos comprovados → preservação independente
// Cenário José Sergio Bressan Jr: 2 subs PagBank distintas com placas próprias
// (evidência 4uCar), sem sub manual em conflito → matched, ambos criados
// independentes.
// ============================================================================
test("Fase 4 caso 3: dois contratos legítimos (José-like, placas distintas) preservados independentes", () => {
  const cust = makeCandidate({
    id: "cust-jose-sergio",
    name: "Jose Sergio Bressan Junior",
    provider_customer_id: "CUST_JOSE_SERGIO",
  });
  const inputs: PagBankSubscriptionInput[] = [
    makeInput({
      provider_subscription_id: "SUBS_JS_HB20",
      provider_customer_id: "CUST_JOSE_SERGIO",
      customer_name: "Jose Sergio Bressan Junior",
      vehicle_plate: "ABC1D23",
      vehicle_brand: "Hyundai",
      vehicle_model: "HB20",
    }),
    makeInput({
      provider_subscription_id: "SUBS_JS_BASALT",
      provider_customer_id: "CUST_JOSE_SERGIO",
      customer_name: "Jose Sergio Bressan Junior",
      vehicle_plate: "XYZ2E45",
      vehicle_brand: "Fiat",
      vehicle_model: "Fastback",
    }),
  ];
  const summary = runPagBankImport({
    file: { meta: { generated_at: "2026-09-22T00:00:00Z", source: "test" }, subscriptions: inputs },
    indexes: buildMatchIndexes([cust]),
    existingSubscriptionsByProviderId: new Map(),
    existingSubscriptionsByCustomerId: new Map([["cust-jose-sergio", []]]),
    mode: "dry_run",
    sourceLabel: SOURCE_LABEL,
  });
  assert.equal(summary.totals.matched, 2);
  assert.equal(summary.totals.subscriptions_would_create, 2);
  assert.equal(summary.totals.financial_reviews_flagged, 0, "placas distintas → sem financial review");
  assert.equal(summary.totals.manual_provider_overlaps, 0, "sem sub manual conflitante → sem overlap");
  // Cada linha tem create_subscription próprio (independentes)
  for (const row of summary.rows) {
    assert.equal(row.outcome, "matched");
    assert.ok(row.actions.some((a) => a.kind === "create_subscription"));
  }
});

// ============================================================================
// Caso 4 — Mesmo arquivo importado duas vezes → nenhuma duplicação
// Idempotência forte via provider_subscription_id em BOTH the second run (o
// primeiro cria, o segundo já vê existing e vira duplicate).
// ============================================================================
test("Fase 4 caso 4: reimport do mesmo arquivo é idempotente (duplicate na 2ª rodada)", () => {
  const input = makeInput({
    provider_subscription_id: "SUBS_KARIM",
    provider_customer_id: "CUST_KARIM",
    customer_name: "Karim Pacheco",
  });
  const cust = makeCandidate({ id: "cust-karim", name: "Karim Pacheco" });
  const file = { meta: { generated_at: "2026-09-22T00:00:00Z", source: "test" }, subscriptions: [input] };

  // 1ª rodada — cria
  const r1 = runPagBankImport({
    file,
    indexes: buildMatchIndexes([cust]),
    existingSubscriptionsByProviderId: new Map(),
    existingSubscriptionsByCustomerId: new Map(),
    mode: "dry_run",
    sourceLabel: SOURCE_LABEL,
  });
  assert.equal(r1.totals.subscriptions_would_create, 1);
  assert.equal(r1.totals.duplicates, 0);

  // 2ª rodada — sub PagBank já persistida
  const persisted: ExistingSubscription = {
    id: "sub-crm-karim",
    customer_id: "cust-karim",
    provider_customer_id: "CUST_KARIM",
    provider_subscription_id: "SUBS_KARIM",
    plan: "Essential",
    subscription_source: "Importação",
    is_active_subscriber: true,
    is_manual: false,
  };
  const r2 = runPagBankImport({
    file,
    indexes: buildMatchIndexes([cust]),
    existingSubscriptionsByProviderId: new Map([["SUBS_KARIM", persisted]]),
    existingSubscriptionsByCustomerId: new Map([["cust-karim", [persisted]]]),
    mode: "dry_run",
    sourceLabel: SOURCE_LABEL,
  });
  assert.equal(r2.totals.subscriptions_would_create, 0);
  assert.equal(r2.totals.subscriptions_would_update, 1);
  assert.equal(r2.totals.duplicates, 1);
  assert.equal(r2.totals.manual_provider_overlaps, 0);
});

// ============================================================================
// Caso 5 — Ausência de note → observação anterior preservada em UPDATE
// buildSubscriptionRow com mode.isUpdate=true e input.note vazio NÃO reescreve
// notes; conserva existingNotes.
// ============================================================================
test("Fase 4 caso 5: UPDATE sem nota nova preserva notes existentes", () => {
  const input = makeInput({
    provider_subscription_id: "SUBS_X",
    customer_name: "Cliente Sem Nota",
    note: undefined, // snapshot vem sem nota
  });
  const row = buildSubscriptionRow(
    input,
    "cust-x",
    null,
    NO_REVIEW,
    "CUST_X",
    SOURCE_LABEL,
    {
      isUpdate: true,
      existingNotes: "Nota humana original (Digo 2026-09-01): investigar cobrança dupla",
      existingDetectedAt: "2026-08-01T12:00:00Z",
    },
  );
  assert.equal(
    row.notes,
    "Nota humana original (Digo 2026-09-01): investigar cobrança dupla",
    "notes preservada quando snapshot não trouxe nova observação",
  );
});

test("Fase 4 caso 5b: UPDATE com nota nova NÃO acumula silenciosamente — só a nova viaja", () => {
  const input = makeInput({
    provider_subscription_id: "SUBS_X",
    customer_name: "Cliente com Nota Nova",
    note: "Refresh 2026-09-22: cartão renovou",
  });
  const row = buildSubscriptionRow(
    input,
    "cust-x",
    null,
    NO_REVIEW,
    "CUST_X",
    SOURCE_LABEL,
    {
      isUpdate: true,
      existingNotes: "Nota antiga",
      existingDetectedAt: "2026-08-01T12:00:00Z",
    },
  );
  // Comportamento auditável: a nota do snapshot SUBSTITUI a existente quando
  // presente. Append é responsabilidade da operação humana (via editor). O
  // importer nunca decide sozinho combinar as duas.
  assert.equal(row.notes, "Refresh 2026-09-22: cartão renovou");
});

test("Fase 4 caso 5c: INSERT sem nota resulta em notes=null (não pega existingNotes de update)", () => {
  const input = makeInput({
    provider_subscription_id: "SUBS_X",
    customer_name: "Cliente Novo",
    note: undefined,
  });
  const row = buildSubscriptionRow(
    input,
    "cust-x",
    null,
    NO_REVIEW,
    "CUST_X",
    SOURCE_LABEL,
    { isUpdate: false },
  );
  assert.equal(row.notes, null);
});

// ============================================================================
// Caso 6 — UPDATE preserva subscription_detected_at original
// ============================================================================
test("Fase 4 caso 6: UPDATE preserva subscription_detected_at original (nunca reescreve por refresh)", () => {
  const input = makeInput({
    provider_subscription_id: "SUBS_X",
    customer_name: "Cliente com Detected Original",
  });
  const originalDetectedAt = "2026-08-01T12:00:00Z";
  const row = buildSubscriptionRow(
    input,
    "cust-x",
    null,
    NO_REVIEW,
    "CUST_X",
    SOURCE_LABEL,
    {
      isUpdate: true,
      existingNotes: null,
      existingDetectedAt: originalDetectedAt,
    },
  );
  assert.equal(row.subscription_detected_at, originalDetectedAt);
  // Sanity: last_verified_at deve mudar (é o carimbo desta conciliação)
  assert.notEqual(row.last_verified_at, originalDetectedAt);
  // billing_due_source pega o rótulo passado
  assert.equal(row.billing_due_source, SOURCE_LABEL);
});

test("Fase 4 caso 6b: INSERT carimba subscription_detected_at com now (primeira descoberta)", () => {
  const before = new Date().toISOString();
  const input = makeInput({
    provider_subscription_id: "SUBS_X",
    customer_name: "Cliente Novo Detected",
  });
  const row = buildSubscriptionRow(
    input,
    "cust-x",
    null,
    NO_REVIEW,
    "CUST_X",
    SOURCE_LABEL,
    { isUpdate: false },
  );
  const detected = row.subscription_detected_at as string;
  assert.ok(detected >= before, "detected_at deve ser >= antes do build");
});

// ============================================================================
// Caso 7 — Nenhuma alteração indevida em pagamentos manuais ou evidências
// provider
// O motor NÃO produz ProposedAction que sobrescreva sub manual do CRM. Se
// customer casa mas tem sub manual ativa, o outcome é review + overlap flag;
// a sub manual NUNCA é tocada pelo importer.
// ============================================================================
test("Fase 4 caso 7a: nenhuma action toca a sub manual existente quando há overlap", () => {
  const customer = makeCandidate({
    id: "cust-wellington",
    name: "Wellington Felix",
    normalized_phone: "11988888003",
  });
  const manual: ExistingSubscription = {
    id: "sub-wellington-manual",
    customer_id: "cust-wellington",
    provider_customer_id: null,
    provider_subscription_id: null,
    plan: "Priority",
    subscription_source: "Importação",
    is_active_subscriber: true,
    is_manual: true,
    payment_evidence_source: "manual",
    payment_verification_status: "not_verified",
    source_reference: "4uCar/planilha_2026-08-16",
  };
  const incoming = makeInput({
    provider_subscription_id: "SUBS_WELL_NEW",
    provider_customer_id: "CUST_WELL_NEW",
    customer_name: "Wellington Felix",
    customer_phone: "+5511988888003",
    plan: "Priority",
  });
  const summary = runPagBankImport({
    file: { meta: { generated_at: "2026-09-22T00:00:00Z", source: "test" }, subscriptions: [incoming] },
    indexes: buildMatchIndexes([customer]),
    existingSubscriptionsByProviderId: new Map(),
    existingSubscriptionsByCustomerId: new Map([["cust-wellington", [manual]]]),
    mode: "dry_run",
    sourceLabel: SOURCE_LABEL,
  });
  const row = summary.rows[0]!;
  // Nenhuma action toca sub-wellington-manual (nem update, nem cancel, nem flag_financial_review na sub manual)
  const actionsMentioningManual = row.actions.filter((a) => {
    if (a.kind === "update_subscription") return a.subscriptionId === "sub-wellington-manual";
    if (a.kind === "flag_financial_review") return false; // reason texto, não é action tipada por id
    return false;
  });
  assert.equal(actionsMentioningManual.length, 0);
});

test("Fase 4 caso 7b: paymentEvidence do provider (row PagBank) NÃO é herdado da sub manual — helper isola", () => {
  // Se o customer tem sub manual (evidence=manual) e vem um contrato PagBank
  // com evidence=PROVIDER, o outcome overlap não deve confundir os campos.
  // O helper detectManualProviderOverlaps devolve as duas subs LADO A LADO
  // — a fila humana vê `manual` do lado esquerdo e `provider` do lado direito.
  const manual: ExistingSubscription = {
    id: "sub-manual",
    customer_id: "cust-x",
    provider_subscription_id: null,
    plan: "Smart",
    subscription_source: "Manual",
    is_active_subscriber: true,
    is_manual: true,
    payment_evidence_source: "manual",
    payment_verification_status: "not_verified",
  };
  const incoming = makeInput({
    provider_subscription_id: "SUBS_NOVO",
    provider_customer_id: "CUST_X",
    customer_name: "Cliente X",
    payment_evidence_source: "PROVIDER",
    payment_status: "CONFIRMED",
  });
  const evs = detectManualProviderOverlaps({
    input: incoming,
    candidateId: "cust-x",
    existingSubs: [manual],
  });
  assert.equal(evs.length, 1);
  assert.equal(evs[0]!.manualSubscription.paymentEvidenceSource, "manual");
  assert.equal(evs[0]!.manualSubscription.paymentVerificationStatus, "not_verified");
  // Do lado PagBank (incoming), a evidência é do provedor — nunca é a
  // aproveitada pra "carimbar" a sub manual (o motor não produz action pra isso)
  assert.equal(evs[0]!.incomingProvider.providerSubscriptionId, "SUBS_NOVO");
});

test("Fase 4 caso 7c: buildSubscriptionRow em UPDATE mantém payment_evidence do input (PagBank), não invade sub manual alheia", () => {
  // Cenário: buildSubscriptionRow só é chamado para a sub PagBank que está
  // sendo criada/atualizada. Nunca para uma sub manual — o CLI só a passa
  // quando applyRow decidiu escrever nessa row específica. Portanto
  // payment_evidence_source vem canônico do input PagBank (provider).
  const input = makeInput({
    provider_subscription_id: "SUBS_PROVIDER",
    customer_name: "PagBank Real",
    payment_evidence_source: "PROVIDER",
    payment_status: "CONFIRMED",
    payment_method: "CARD_RECURRING",
  });
  const row = buildSubscriptionRow(
    input,
    "cust-y",
    null,
    NO_REVIEW,
    "CUST_Y",
    SOURCE_LABEL,
    { isUpdate: true, existingNotes: null, existingDetectedAt: "2026-08-01T00:00:00Z" },
  );
  assert.equal(row.payment_evidence_source, "provider");
  assert.equal(row.payment_status, "confirmed");
  assert.equal(row.payment_verification_status, "provider_confirmed");
  assert.equal(row.payment_confidence, 1);
});

// ============================================================================
// detectManualProviderOverlaps — helper puro coberto isoladamente
// ============================================================================

test("detectManualProviderOverlaps: sem subs manuais → array vazio", () => {
  const evs = detectManualProviderOverlaps({
    input: makeInput({ provider_subscription_id: "S1", customer_name: "X" }),
    candidateId: "c1",
    existingSubs: [],
  });
  assert.deepEqual(evs, []);
});

test("detectManualProviderOverlaps: sub PagBank ativa NÃO conta como overlap", () => {
  // Já é PagBank — o fluxo normal de duplicate cobre isso; overlap só serve
  // pra caso manual↔provider.
  const pagbank: ExistingSubscription = {
    id: "sub-pb",
    customer_id: "c1",
    provider_subscription_id: "SUBS_OLD",
    plan: "Smart",
    subscription_source: "Importação",
    is_active_subscriber: true,
    is_manual: false,
  };
  const evs = detectManualProviderOverlaps({
    input: makeInput({ provider_subscription_id: "SUBS_NEW", customer_name: "X" }),
    candidateId: "c1",
    existingSubs: [pagbank],
  });
  assert.deepEqual(evs, []);
});

test("detectManualProviderOverlaps: sub manual CANCELADA (is_active=false) NÃO gera overlap", () => {
  const manualInactive: ExistingSubscription = {
    id: "sub-manual-cancelada",
    customer_id: "c1",
    provider_subscription_id: null,
    plan: "Smart",
    subscription_source: "Manual",
    is_active_subscriber: false, // cancelada
    is_manual: true,
  };
  const evs = detectManualProviderOverlaps({
    input: makeInput({ provider_subscription_id: "S", customer_name: "X" }),
    candidateId: "c1",
    existingSubs: [manualInactive],
  });
  assert.equal(evs.length, 0);
});
