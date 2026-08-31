import { KNOWN_SUBSCRIBERS_2026_08_16 } from "./known-subscribers.ts";
import type { DgnCustomer } from "./dgn-growth-data.ts";
import { matchKnownSubscriber } from "./founder-eligibility.ts";

// -----------------------------------------------------------------------------
// Fonte canônica das métricas Founder. Dashboard, tela /founders-2026 e Agent
// consomem daqui — proibido calcular em outro lugar. Se algo mudar (nova vaga,
// renumeração, política de "vaga reaberta"), muda aqui e todo mundo enxerga o
// mesmo número.
//
// REGRA CANÔNICA (2026-08-31):
// - "Founder confirmado" = tem número preservado 001/002/003.
//   Nº001 Benedito · Nº002 José Moreira · Nº003 Rikardo Oliveira.
//   Total FIXO = 3 até que Nº004+ sejam confirmados no CRM.
// - Iara Menezes (Nº004 reaberta) NÃO é confirmada; é assinante Priority
//   ocupando uma vaga historicamente separada. Não conta no confirmedFounders.
// - "Convite ativo" = customer com personalizedPagePath + não é Founder
//   confirmado + não converteu. Founder confirmado ≠ convite ativo (já é
//   Founder, não precisa de convite).
// -----------------------------------------------------------------------------

export const FOUNDER_GOAL = 30 as const;

/** Vagas Founder confirmadas na base viva 4uCar 2026-08-16. Sempre 001/002/003. */
export function getConfirmedFounderRecords() {
  return KNOWN_SUBSCRIBERS_2026_08_16.filter((s) => Boolean(s.preservedFounderNumber));
}

/** Count canônico usado no Dashboard, na tela Founders e no Agent. */
export function getConfirmedFoundersCount(): number {
  return getConfirmedFounderRecords().length;
}

/**
 * Próximo número Founder disponível para nova confirmação.
 * Hoje: confirmed=3 (001/002/003) → 4. A Iara Menezes NÃO ocupa Nº004
 * (é assinante Priority, sinalização Founder é histórico legado).
 */
export function getNextAvailableFounderNumber(): number {
  return getConfirmedFoundersCount() + 1;
}

/** Formata como string zero-padded: 4 → "004". */
export function formatFounderNumber(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Registros que têm `isReopenedFounder=true` na base viva. NÃO significa que
 * ocupam vaga Founder — significa que já foram sinalizados no processo em
 * algum momento e hoje são assinantes conhecidos (retenção). Nº004 continua
 * DISPONÍVEL enquanto nenhum cliente novo for confirmado.
 */
export function getLegacyFounderCandidates() {
  return KNOWN_SUBSCRIBERS_2026_08_16.filter((s) => s.isReopenedFounder === true);
}

/** @deprecated use `getLegacyFounderCandidates()`. Mantido para compat. */
export const getReopenedFounderRecords = getLegacyFounderCandidates;

/** Cliente é Founder confirmado (tem número 001/002/003 preservado). */
export function isConfirmedFounderCustomer(customer: Pick<DgnCustomer, "campaign">): boolean {
  return customer.campaign?.founderStatus === "confirmado";
}

/**
 * Convite EM ABERTO = tem página personalizada + não é Founder confirmado +
 * não é assinante conhecido (base viva 4uCar) + não converteu. Base para o
 * número "Convites em aberto" no Dashboard, na tela Founders e no Agent.
 *
 * Bate 1:1 com `pipeline.invitesOpen + pipeline.viewedOpen` do snapshot.
 */
export function isOpenInviteCustomer(customer: DgnCustomer): boolean {
  if (!customer.campaign?.personalizedPagePath) return false;
  if (isConfirmedFounderCustomer(customer)) return false;
  if (customer.commercialStatus === "Assinante Ativo") return false;
  if (customer.campaign?.commercialStage === "convertido") return false;
  if (isKnownSubscriberCustomer(customer)) return false;
  return true;
}

/** Alias legado — preserva import antigo. Mesma função. */
export const isActiveInviteCustomer = isOpenInviteCustomer;

/** Lista de customers com convite em aberto. */
export function getOpenInviteCustomers(customers: DgnCustomer[]): DgnCustomer[] {
  return customers.filter(isOpenInviteCustomer);
}

/** Alias legado — preserva import antigo. */
export const getActiveInviteCustomers = getOpenInviteCustomers;

/** Count canônico de convites em aberto consumido pelos 3 módulos. */
export function getOpenInvitesCount(customers: DgnCustomer[]): number {
  return getOpenInviteCustomers(customers).length;
}

/** Alias legado. */
export const getActiveInvitesCount = getOpenInvitesCount;

// ---------------------------------------------------------------------------
// Pipeline snapshot — estados MUTUAMENTE EXCLUSIVOS do momento atual.
// ---------------------------------------------------------------------------
//
// Cada cliente entra em EXATAMENTE UM bucket. Founders confirmados NÃO
// entram no snapshot (já são Founder, não estão em pipeline). Assinantes
// conhecidos (base viva 4uCar) NÃO entram (retenção, não aquisição).
//
// Ordem de classificação (do "mais avançado" para o "mais atrás"): converted
// → paymentPending → conversing → viewedOpen → invitesOpen → selected. Isso
// garante que a soma dos buckets bate com o total de "candidatos em pipeline".
//
// Métricas históricas (invitesEverIssued, invitesEverViewed, conversionsEver)
// ficam separadas em `FounderHistoricalMetrics` — jamais somadas ao snapshot.

export type PipelineStage =
  | "selected"
  | "invitesOpen"
  | "viewedOpen"
  | "conversing"
  | "paymentPending"
  | "converted";

export interface FounderPipelineSnapshot {
  selected: number;
  invitesOpen: number;
  viewedOpen: number;
  conversing: number;
  paymentPending: number;
  converted: number;
}

const EMPTY_SNAPSHOT: FounderPipelineSnapshot = {
  selected: 0,
  invitesOpen: 0,
  viewedOpen: 0,
  conversing: 0,
  paymentPending: 0,
  converted: 0,
};

function isKnownSubscriberCustomer(customer: DgnCustomer): boolean {
  return matchKnownSubscriber(customer) !== null;
}

/** Classifica o cliente em UM estágio do snapshot, ou retorna null se está fora. */
export function classifyPipelineStage(customer: DgnCustomer): PipelineStage | null {
  // Founder já confirmado não entra em pipeline (já é destino).
  if (isConfirmedFounderCustomer(customer)) return null;
  // Assinante conhecido não entra em aquisição — retenção separada.
  if (isKnownSubscriberCustomer(customer)) return null;
  if (customer.commercialStatus === "Assinante Ativo") return null;

  const campaign = customer.campaign ?? {};

  if (campaign.commercialStage === "convertido") return "converted";
  if (campaign.campaignStatus === "Pagamento enviado") return "paymentPending";
  if (campaign.campaignStatus === "Conversando") return "conversing";

  const viewed = Boolean(campaign.engagement?.viewedAt);
  const hasInvite = Boolean(campaign.personalizedPagePath);

  if (hasInvite && viewed) return "viewedOpen";
  if (hasInvite) return "invitesOpen";

  // Selecionado mas ainda sem página gerada.
  if (campaign.founderSelected && !hasInvite) return "selected";
  if (campaign.founderStatus === "selecionado") return "selected";

  return null;
}

export function computePipelineSnapshot(customers: DgnCustomer[]): FounderPipelineSnapshot {
  const snapshot: FounderPipelineSnapshot = { ...EMPTY_SNAPSHOT };
  for (const c of customers) {
    const stage = classifyPipelineStage(c);
    if (!stage) continue;
    snapshot[stage] += 1;
  }
  return snapshot;
}

/** Soma dos 6 buckets — sempre igual ao total de clientes em pipeline. */
export function pipelineTotal(snapshot: FounderPipelineSnapshot): number {
  return (
    snapshot.selected +
    snapshot.invitesOpen +
    snapshot.viewedOpen +
    snapshot.conversing +
    snapshot.paymentPending +
    snapshot.converted
  );
}

// ---------------------------------------------------------------------------
// Métricas históricas — nunca somadas ao snapshot.
// ---------------------------------------------------------------------------

export interface FounderHistoricalMetrics {
  invitesEverIssued: number;
  invitesEverViewed: number;
  conversionsEver: number;
}

export function computeHistoricalMetrics(customers: DgnCustomer[]): FounderHistoricalMetrics {
  let invitesEverIssued = 0;
  let invitesEverViewed = 0;
  let conversionsEver = 0;
  for (const c of customers) {
    if (c.campaign?.personalizedPagePath) invitesEverIssued += 1;
    if (c.campaign?.engagement?.viewedAt) invitesEverViewed += 1;
    if (c.campaign?.commercialStage === "convertido") conversionsEver += 1;
  }
  return { invitesEverIssued, invitesEverViewed, conversionsEver };
}

// ---------------------------------------------------------------------------
// Snapshot canônico consumido por Dashboard, tela Founders e Agent.
// ---------------------------------------------------------------------------

export interface FounderMetricsSnapshot {
  confirmedFounders: number;
  /** Alias legado para `openInvites`. Preserva compat, mesma métrica. */
  activeInvites: number;
  /** Convites em aberto (não confirmados, não convertidos, não expirados). */
  openInvites: number;
  /** Próxima vaga Founder livre. Hoje: 4 (Nº001/002/003 confirmados). */
  nextAvailableFounderNumber: number;
  /** Formato display "004". */
  nextAvailableFounderLabel: string;
  /** Candidatos que já foram sinalizados no processo Founder mas hoje são
   * assinantes reconhecidos. NÃO ocupam vaga. Serve apenas para contextualizar
   * histórico legado no Perfil 360 e no Agent. */
  legacyFounderCandidatesCount: number;
  goal: typeof FOUNDER_GOAL;
  available: number;
  pipeline: FounderPipelineSnapshot;
  historical: FounderHistoricalMetrics;
}

export function computeFounderMetrics(customers: DgnCustomer[]): FounderMetricsSnapshot {
  const confirmedFounders = getConfirmedFoundersCount();
  const pipeline = computePipelineSnapshot(customers);
  const historical = computeHistoricalMetrics(customers);
  const openInvites = pipeline.invitesOpen + pipeline.viewedOpen;
  const nextAvailableFounderNumber = getNextAvailableFounderNumber();
  return {
    confirmedFounders,
    activeInvites: openInvites,
    openInvites,
    nextAvailableFounderNumber,
    nextAvailableFounderLabel: formatFounderNumber(nextAvailableFounderNumber),
    legacyFounderCandidatesCount: getLegacyFounderCandidates().length,
    goal: FOUNDER_GOAL,
    available: FOUNDER_GOAL - confirmedFounders,
    pipeline,
    historical,
  };
}
