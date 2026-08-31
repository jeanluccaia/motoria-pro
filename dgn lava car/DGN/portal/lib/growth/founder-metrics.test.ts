import { test } from "node:test";
import assert from "node:assert/strict";

import { KNOWN_SUBSCRIBERS_2026_08_16 } from "./known-subscribers.ts";
import type { DgnCustomer } from "./dgn-growth-data.ts";
import {
  FOUNDER_GOAL,
  classifyPipelineStage,
  computeFounderMetrics,
  computePipelineSnapshot,
  formatFounderNumber,
  getActiveInvitesCount,
  getConfirmedFounderRecords,
  getConfirmedFoundersCount,
  getLegacyFounderCandidates,
  getNextAvailableFounderNumber,
  getOpenInvitesCount,
  getReopenedFounderRecords,
  isActiveInviteCustomer,
  isConfirmedFounderCustomer,
  pipelineTotal,
  type FounderPipelineSnapshot,
} from "./founder-metrics.ts";

// -----------------------------------------------------------------------------
// Prova o "single source of truth" das métricas Founder:
//  1. Confirmed = 3 (Nº001 Benedito, Nº002 José, Nº003 Rikardo).
//  2. Iara (Nº004 reaberta) NUNCA conta como confirmada.
//  3. Convite ativo exclui Founder confirmado, assinante ativo e converted.
//  4. `computeFounderMetrics` produz o mesmo snapshot consumido por Dashboard,
//     tela Founders e Agent — se algum módulo copiasse a lógica, a regressão
//     falharia aqui.
// -----------------------------------------------------------------------------

function baseCustomer(overrides: Partial<DgnCustomer> & { id: string; name: string }): DgnCustomer {
  return {
    id: overrides.id,
    name: overrides.name,
    phone: "",
    vehicle: "",
    plate: "",
    companyLink: "",
    origin: "",
    attendanceHistory: [],
    washCount: 0,
    historicalValue: 0,
    customerSince: "2024-01-01",
    lastAttendance: "2026-08-01",
    scoreDgn: 0,
    recommendedPlan: "Smart",
    commercialStatus: overrides.commercialStatus ?? "Aguardando Curadoria DGN",
    recurrence: "",
    averageVisitIntervalDays: 0,
    hasValidPhone: true,
    curation: { profile: "", originGroup: "", commercialProfile: "", idealSchedule: "", founderDecision: "", founderNumber: "", internalNotes: "" },
    campaign: overrides.campaign ?? {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "", lastAction: "",
      nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  } as DgnCustomer;
}

test("getConfirmedFoundersCount = 3 (001/002/003 preservados)", () => {
  assert.equal(getConfirmedFoundersCount(), 3);
  const records = getConfirmedFounderRecords();
  const numbers = records.map((r) => r.preservedFounderNumber).sort();
  assert.deepEqual(numbers, ["001", "002", "003"]);
});

test("Iara Nº004: NÃO é Founder confirmada, aparece como candidato legado", () => {
  const iara = KNOWN_SUBSCRIBERS_2026_08_16.find((s) => s.isReopenedFounder);
  assert.ok(iara, "Iara deve estar na base viva com isReopenedFounder");
  const confirmedNames = getConfirmedFounderRecords().map((r) => r.name);
  assert.ok(!confirmedNames.includes(iara!.name), "Iara NÃO pode aparecer em confirmados");
  const legacy = getLegacyFounderCandidates();
  assert.ok(legacy.some((r) => r.name === iara!.name), "Iara aparece em legacyFounderCandidates");
  // Alias legado ainda funciona.
  assert.equal(getReopenedFounderRecords().length, legacy.length);
});

test("getNextAvailableFounderNumber = 4 (confirmed=3 → próximo=4)", () => {
  assert.equal(getNextAvailableFounderNumber(), 4);
  assert.equal(formatFounderNumber(getNextAvailableFounderNumber()), "004");
});

test("computeFounderMetrics: nextAvailableFounderLabel = '004' e Nº004 é disponível", () => {
  const snap = computeFounderMetrics([]);
  assert.equal(snap.confirmedFounders, 3);
  assert.equal(snap.nextAvailableFounderNumber, 4);
  assert.equal(snap.nextAvailableFounderLabel, "004");
  // Iara conta como candidato legado, não como confirmed.
  assert.ok(snap.legacyFounderCandidatesCount >= 1);
});

test("isActiveInviteCustomer: convite ativo padrão", () => {
  const c = baseCustomer({
    id: "c1",
    name: "C1",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/c1", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  });
  assert.equal(isActiveInviteCustomer(c), true);
});

test("isActiveInviteCustomer: Founder confirmado NÃO é convite ativo", () => {
  const c = baseCustomer({
    id: "c2",
    name: "C2",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "001", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "/f/c2", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "confirmado",
    } as DgnCustomer["campaign"],
  });
  assert.equal(isActiveInviteCustomer(c), false);
});

test("isActiveInviteCustomer: assinante ativo NÃO é convite ativo", () => {
  const c = baseCustomer({
    id: "c3",
    name: "C3",
    commercialStatus: "Assinante Ativo",
    campaign: {
      currentCampaign: "", founderSelected: false, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "/f/c3", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    },
  });
  assert.equal(isActiveInviteCustomer(c), false);
});

test("isConfirmedFounderCustomer: usa founderStatus 'confirmado'", () => {
  const c = baseCustomer({
    id: "c4",
    name: "C4",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "001", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "/f/c4", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "confirmado",
    } as DgnCustomer["campaign"],
  });
  assert.equal(isConfirmedFounderCustomer(c), true);
});

// ---------------------------------------------------------------------------
// Pipeline snapshot mutuamente exclusivo (A/QA)
// ---------------------------------------------------------------------------

test("classifyPipelineStage: cliente convertido é 'converted' (mais avançado ganha)", () => {
  const c = baseCustomer({
    id: "conv-1",
    name: "Convertido",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Conversando", personalizedPagePath: "/f/conv-1", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      commercialStage: "convertido",
    } as DgnCustomer["campaign"],
  });
  assert.equal(classifyPipelineStage(c), "converted");
});

test("classifyPipelineStage: cliente que visualizou entra em 'viewedOpen', não 'invitesOpen'", () => {
  const c = baseCustomer({
    id: "view-1",
    name: "Visualizou",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Visualizou", personalizedPagePath: "/f/view-1", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      engagement: {
        viewedAt: "2026-08-28T10:00:00Z", lastViewedAt: "2026-08-28T10:00:00Z", viewCount: 1,
        confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0,
      },
    } as DgnCustomer["campaign"],
  });
  assert.equal(classifyPipelineStage(c), "viewedOpen");
});

test("classifyPipelineStage: Founder confirmado NÃO entra em snapshot", () => {
  const c = baseCustomer({
    id: "founder-x",
    name: "Founder X",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "001", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "/f/x", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "confirmado",
    } as DgnCustomer["campaign"],
  });
  assert.equal(classifyPipelineStage(c), null);
});

test("classifyPipelineStage: assinante conhecido (Iara Nº004 reaberta) NÃO entra em snapshot", () => {
  const iara = baseCustomer({
    id: "iara",
    name: "Iara Menezes",
    phone: "19991931501",
    plate: "FUR8369",
    campaign: {
      currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Selecionado", personalizedPagePath: "", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      founderStatus: "selecionado",
    } as DgnCustomer["campaign"],
  });
  // Iara é matchKnownSubscriber por phone/plate → fora do pipeline.
  assert.equal(classifyPipelineStage(iara), null);
});

test("computePipelineSnapshot: soma dos 6 buckets = total classificado (mutualidade)", () => {
  const customers: DgnCustomer[] = [
    baseCustomer({ id: "c1", name: "Selected", campaign: {
      currentCampaign: "", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    }}),
    baseCustomer({ id: "c2", name: "Invite Open", campaign: {
      currentCampaign: "", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Convite criado", personalizedPagePath: "/f/c2", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    }}),
    baseCustomer({ id: "c3", name: "Viewed", campaign: {
      currentCampaign: "", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Visualizou", personalizedPagePath: "/f/c3", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      engagement: { viewedAt: "2026-08-28", lastViewedAt: "", viewCount: 1, confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0 },
    } as DgnCustomer["campaign"]}),
    baseCustomer({ id: "c4", name: "Talking", campaign: {
      currentCampaign: "", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Conversando", personalizedPagePath: "/f/c4", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    }}),
  ];
  const snap = computePipelineSnapshot(customers);
  assert.equal(snap.selected, 1);
  assert.equal(snap.invitesOpen, 1);
  assert.equal(snap.viewedOpen, 1);
  assert.equal(snap.conversing, 1);
  assert.equal(pipelineTotal(snap), 4, "soma dos buckets bate com total classificado");
});

test("getOpenInvitesCount == invitesOpen + viewedOpen (canônico)", () => {
  const customers: DgnCustomer[] = [
    baseCustomer({ id: "c1", name: "Invite", campaign: {
      currentCampaign: "", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "", personalizedPagePath: "/f/c1", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
    }}),
    baseCustomer({ id: "c2", name: "Viewed", campaign: {
      currentCampaign: "", founderSelected: true, founderNumber: "", founderCondition: "",
      campaignStatus: "Visualizou", personalizedPagePath: "/f/c2", paymentLink: "",
      lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
      kitStatus: "", cardStatus: "",
      engagement: { viewedAt: "2026-08-28", lastViewedAt: "", viewCount: 1, confirmClickedAt: "", confirmClickCount: 0, vipClickedAt: "", vipClickCount: 0 },
    } as DgnCustomer["campaign"]}),
  ];
  const snap = computePipelineSnapshot(customers);
  assert.equal(getOpenInvitesCount(customers), snap.invitesOpen + snap.viewedOpen);
  // Alias legado bate igual.
  assert.equal(getActiveInvitesCount(customers), getOpenInvitesCount(customers));
});

test("computeFounderMetrics: cross-module snapshot canônico", () => {
  const customers: DgnCustomer[] = [
    baseCustomer({
      id: "invite-1",
      name: "Convite 1",
      campaign: {
        currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
        campaignStatus: "Convite criado", personalizedPagePath: "/f/invite-1", paymentLink: "",
        lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
        kitStatus: "", cardStatus: "",
      },
    }),
    baseCustomer({
      id: "invite-2",
      name: "Convite 2",
      campaign: {
        currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "", founderCondition: "",
        campaignStatus: "Convite criado", personalizedPagePath: "/f/invite-2", paymentLink: "",
        lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
        kitStatus: "", cardStatus: "",
      },
    }),
    baseCustomer({
      id: "founder-conf",
      name: "Founder confirmado",
      campaign: {
        currentCampaign: "Founders 2026", founderSelected: true, founderNumber: "001", founderCondition: "",
        campaignStatus: "", personalizedPagePath: "/f/founder-conf", paymentLink: "",
        lastAction: "", nextAction: "", lastContact: "", conversationStatus: "", notes: "",
        kitStatus: "", cardStatus: "",
        founderStatus: "confirmado",
      } as DgnCustomer["campaign"],
    }),
  ];

  const snapshot = computeFounderMetrics(customers);
  assert.equal(snapshot.confirmedFounders, 3, "confirmed sempre = 3 (canônico da base viva)");
  assert.equal(snapshot.activeInvites, 2, "convite ativo exclui founder confirmado");
  assert.equal(snapshot.goal, FOUNDER_GOAL);
  assert.equal(snapshot.available, FOUNDER_GOAL - 3);
  // Contagem só depende do count via helpers — mesmo valor consumido por
  // Dashboard, tela Founders e Agent.
  assert.equal(getActiveInvitesCount(customers), snapshot.activeInvites);
  assert.equal(getConfirmedFoundersCount(), snapshot.confirmedFounders);
});
