import test from "node:test";
import assert from "node:assert/strict";
import {
  ingestBufferOnLoad,
  clearRecovery,
  BUFFER_KEY_PREFIX,
  RECOVERY_KEY_PREFIX,
  type RecoveryStore,
} from "./recovery-storage.ts";

interface Snap { summary: string }

function fakeStore(): RecoveryStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    read: (k) => data.get(k) ?? null,
    write: (k, v) => { data.set(k, v); },
    remove: (k) => { data.delete(k); },
  };
}

test("sem buffer nem recovery → estado limpo", () => {
  const s = fakeStore();
  const r = ingestBufferOnLoad<Snap>(s, "diag-1", 3);
  assert.equal(r.hadBuffer, false);
  assert.equal(r.bufferApplied, false);
  assert.equal(r.recovery, null);
});

test("buffer com mesma revision do server → aplica em memória (usuário fechou aba)", () => {
  const s = fakeStore();
  s.data.set(BUFFER_KEY_PREFIX + "diag-1", JSON.stringify({ rev: 5, snapshot: { summary: "meu texto" } }));
  const r = ingestBufferOnLoad<Snap>(s, "diag-1", 5);
  assert.equal(r.hadBuffer, true);
  assert.equal(r.bufferApplied, true);
  assert.equal(r.recovery, null);
});

test("buffer com revision divergente → move pra recovery, NÃO aplica, NÃO descarta", () => {
  const s = fakeStore();
  s.data.set(BUFFER_KEY_PREFIX + "diag-1", JSON.stringify({ rev: 3, snapshot: { summary: "texto local" } }));
  const r = ingestBufferOnLoad<Snap>(s, "diag-1", 5, () => "2026-09-23T20:00:00.000Z");
  assert.equal(r.hadBuffer, true);
  assert.equal(r.bufferApplied, false);
  assert.deepEqual(r.recovery, {
    savedRev: 3,
    snapshot: { summary: "texto local" },
    quarantinedAt: "2026-09-23T20:00:00.000Z",
    reason: "revision_mismatch",
  });
  // Buffer removido, recovery salva
  assert.equal(s.data.has(BUFFER_KEY_PREFIX + "diag-1"), false);
  assert.equal(s.data.has(RECOVERY_KEY_PREFIX + "diag-1"), true);
});

test("recovery persistente entre reloads (não some sozinho)", () => {
  const s = fakeStore();
  s.data.set(RECOVERY_KEY_PREFIX + "diag-1", JSON.stringify({
    savedRev: 2, snapshot: { summary: "trabalho antigo" }, quarantinedAt: "t0", reason: "revision_mismatch",
  }));
  // Segundo carregamento sem buffer novo → recovery continua pendurada
  const r = ingestBufferOnLoad<Snap>(s, "diag-1", 10);
  assert.equal(r.hadBuffer, false);
  assert.ok(r.recovery, "recovery deve continuar apresentável");
  assert.equal(r.recovery?.savedRev, 2);
});

test("clearRecovery só limpa após ação explícita do operador", () => {
  const s = fakeStore();
  s.data.set(RECOVERY_KEY_PREFIX + "diag-1", "any");
  clearRecovery(s, "diag-1");
  assert.equal(s.data.has(RECOVERY_KEY_PREFIX + "diag-1"), false);
});

test("buffer com JSON corrompido é ignorado (não crasha, não vira recovery)", () => {
  const s = fakeStore();
  s.data.set(BUFFER_KEY_PREFIX + "diag-1", "{not-json");
  const r = ingestBufferOnLoad<Snap>(s, "diag-1", 5);
  assert.equal(r.hadBuffer, false);
  assert.equal(r.recovery, null);
  assert.equal(s.data.has(BUFFER_KEY_PREFIX + "diag-1"), false);
});

test("recovery da rodada anterior + buffer novo com revision divergente → recovery é REESCRITO com o mais recente", () => {
  const s = fakeStore();
  // Recovery velho já existia
  s.data.set(RECOVERY_KEY_PREFIX + "diag-1", JSON.stringify({
    savedRev: 1, snapshot: { summary: "velho" }, quarantinedAt: "t0", reason: "revision_mismatch",
  }));
  // Buffer nova sessão, também obsoleto
  s.data.set(BUFFER_KEY_PREFIX + "diag-1", JSON.stringify({ rev: 3, snapshot: { summary: "novo" } }));
  const r = ingestBufferOnLoad<Snap>(s, "diag-1", 10, () => "t1");
  // Aviso: sobrescreve. O comportamento oficial é sempre mostrar o mais recente
  // (buffer local mais fresco tem chance maior de refletir o trabalho atual).
  assert.equal(r.bufferApplied, false);
  assert.equal(r.recovery?.snapshot.summary, "novo");
  assert.equal(r.recovery?.quarantinedAt, "t1");
});
