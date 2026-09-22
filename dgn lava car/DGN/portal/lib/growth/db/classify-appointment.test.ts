import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAppointment,
  formatAppointmentSaoPaulo,
} from "./classify-appointment.ts";

// Fase 3 — classificação canônica de crm_appointments. Cobre os 10 casos
// do brief do Digo + os 3 casos observados em prod (Gustavo Plensack,
// Benedito Constantino, resíduo SMOKE 2B).

const NOW = new Date("2026-09-21T12:00:00Z"); // 2026-09-21 09:00 São Paulo

test("Fase 3 caso 1: reserva futura válida (scheduled) → PROXIMO", () => {
  const c = classifyAppointment({ scheduledAt: "2026-10-01T14:00:00Z", status: "scheduled", now: NOW });
  assert.equal(c.category, "PROXIMO");
  assert.equal(c.isCancelled, false);
  assert.equal(c.isDone, false);
  assert.equal(c.isTestArtifact, false);
});

test("Fase 3 caso 2: reserva passada scheduled → PENDENTE_DESFECHO (não presume realização)", () => {
  const c = classifyAppointment({ scheduledAt: "2026-09-19T11:30:00Z", status: "scheduled", now: NOW });
  assert.equal(c.category, "PENDENTE_DESFECHO");
});

test("Fase 3 caso 3: reserva cancelada futura → HISTORICO (nunca em Próximos)", () => {
  const c = classifyAppointment({ scheduledAt: "2027-12-31T20:30:00Z", status: "cancelled", now: NOW });
  assert.equal(c.category, "HISTORICO");
  assert.equal(c.isCancelled, true);
});

test("Fase 3 caso 3b: reserva cancelada passada → HISTORICO", () => {
  const c = classifyAppointment({ scheduledAt: "2026-09-14T12:58:00Z", status: "cancelled", now: NOW });
  assert.equal(c.category, "HISTORICO");
});

test("Fase 3 caso 4: reserva concluída (done) → HISTORICO", () => {
  const c = classifyAppointment({ scheduledAt: "2026-08-01T15:00:00Z", status: "done", now: NOW });
  assert.equal(c.category, "HISTORICO");
  assert.equal(c.isDone, true);
});

test("Fase 3 caso 4b: no_show → HISTORICO", () => {
  const c = classifyAppointment({ scheduledAt: "2026-08-01T15:00:00Z", status: "no_show", now: NOW });
  assert.equal(c.category, "HISTORICO");
  assert.equal(c.isDone, true);
});

test("Fase 3 caso 5: virada de dia (23:59 vs 00:01) respeita cronologia", () => {
  // Reserva 23:59 UTC do dia 21/09 = 20:59 SP (passado)
  const past = classifyAppointment({ scheduledAt: "2026-09-21T11:59:00Z", status: "scheduled", now: NOW });
  assert.equal(past.category, "PENDENTE_DESFECHO");
  // Reserva 12:01 UTC = 09:01 SP, 1 minuto no futuro
  const future = classifyAppointment({ scheduledAt: "2026-09-21T12:01:00Z", status: "scheduled", now: NOW });
  assert.equal(future.category, "PROXIMO");
});

test("Fase 3 caso 6: fuso — 22:30 SP do Gustavo (UTC 01:30 dia seguinte) é passado corretamente", () => {
  // Original: 2026-09-11 01:30 UTC = 2026-09-10 22:30 SP. Hoje é 2026-09-21.
  const c = classifyAppointment({ scheduledAt: "2026-09-11T01:30:00Z", status: "scheduled", now: NOW });
  assert.equal(c.category, "PENDENTE_DESFECHO");
  // E o formato mostra 10/09 22:30 no fuso SP
  assert.match(formatAppointmentSaoPaulo("2026-09-11T01:30:00Z"), /10\/09\/2026[, ]+22:30/);
});

test("Fase 3 caso 7: registro de teste comprovado (SMOKE 2B em notes) → isTestArtifact=true", () => {
  const c = classifyAppointment({
    scheduledAt: "2027-12-31T20:30:00Z",
    status: "cancelled",
    notes: "editado via PATCH; id e created_at devem estar intactos",
    now: NOW,
  });
  assert.equal(c.isTestArtifact, true);
  assert.match(c.testReason!, /PATCH smoke/i);
  // Categoria não muda por causa da flag — segue HISTORICO por estar cancelled
  assert.equal(c.category, "HISTORICO");
});

test("Fase 3 caso 7b: marcador SMOKE 2C em notes também é detectado", () => {
  const c = classifyAppointment({
    scheduledAt: "2027-01-01T10:00:00Z", status: "scheduled",
    notes: "SMOKE 2C — validando convite WhatsApp",
    now: NOW,
  });
  assert.equal(c.isTestArtifact, true);
});

test("Fase 3 caso 8: registro real com palavra 'teste' NÃO é marcado como teste (conservador)", () => {
  const c = classifyAppointment({
    scheduledAt: "2026-10-01T14:00:00Z", status: "scheduled",
    notes: "Cliente pediu para testar horário de sexta 14h",
    now: NOW,
  });
  assert.equal(c.isTestArtifact, false, "substring 'teste' solto NÃO deve marcar como artefato");
});

test("Fase 3 caso 8b: notes vazia/null NÃO é marcada como teste", () => {
  assert.equal(classifyAppointment({ scheduledAt: "2026-10-01T14:00:00Z", status: "scheduled", notes: null, now: NOW }).isTestArtifact, false);
  assert.equal(classifyAppointment({ scheduledAt: "2026-10-01T14:00:00Z", status: "scheduled", notes: "", now: NOW }).isTestArtifact, false);
  assert.equal(classifyAppointment({ scheduledAt: "2026-10-01T14:00:00Z", status: "scheduled", now: NOW }).isTestArtifact, false);
});

test("Fase 3: status desconhecido cai em HISTORICO (nunca em Próximos)", () => {
  const c = classifyAppointment({ scheduledAt: "2027-12-31T20:30:00Z", status: "surprised", now: NOW });
  assert.equal(c.category, "HISTORICO");
});

test("Fase 3: status confirmed segue mesma regra de scheduled (futuro → PROXIMO)", () => {
  const c = classifyAppointment({ scheduledAt: "2026-10-01T14:00:00Z", status: "confirmed", now: NOW });
  assert.equal(c.category, "PROXIMO");
});

test("Fase 3: repro real — Benedito 19/09 08:30 SP scheduled em 21/09 → PENDENTE_DESFECHO", () => {
  const c = classifyAppointment({ scheduledAt: "2026-09-19T11:30:00Z", status: "scheduled", now: NOW });
  assert.equal(c.category, "PENDENTE_DESFECHO");
});

test("Fase 3: repro real — Gustavo 21/09 09:00 SP scheduled quando now=12:00 UTC (09:00 SP) → PENDENTE_DESFECHO", () => {
  const c = classifyAppointment({ scheduledAt: "2026-09-21T12:00:00Z", status: "scheduled", now: NOW });
  // scheduled_at == now → não é > now → PENDENTE
  assert.equal(c.category, "PENDENTE_DESFECHO");
});

test("Fase 3: formatAppointmentSaoPaulo devolve — quando ISO inválido", () => {
  assert.equal(formatAppointmentSaoPaulo("invalido"), "—");
});
