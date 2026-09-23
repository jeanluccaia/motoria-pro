import test from "node:test";
import assert from "node:assert/strict";
import {
  createDraftScheduler,
  type DraftPersister,
} from "./draft-storage.ts";

interface FakeState { value: string }

function createFakePersister(): DraftPersister<FakeState> & { store: Map<string, FakeState> } {
  const store = new Map<string, FakeState>();
  return {
    store,
    read: (key) => store.get(key) ?? null,
    write: (key, state) => { store.set(key, { ...state }); },
    clear: (key) => { store.delete(key); },
  };
}

function createFakeTimer() {
  interface Task { fn: () => void; ms: number; id: number; }
  const tasks = new Map<number, Task>();
  let now = 0;
  let seq = 0;
  return {
    now: () => now,
    setTimer: (fn: () => void, ms: number) => {
      seq += 1;
      tasks.set(seq, { fn, ms: now + ms, id: seq });
      return seq;
    },
    clearTimer: (id: number) => { tasks.delete(id); },
    advance: (ms: number) => {
      now += ms;
      // Executa tasks vencidas, em ordem
      const ready = [...tasks.values()].filter((t) => t.ms <= now).sort((a, b) => a.ms - b.ms);
      for (const t of ready) {
        tasks.delete(t.id);
        t.fn();
      }
    },
    pending: () => tasks.size,
  };
}

test("scheduleSave persiste após debounceMs de ociosidade", () => {
  const persister = createFakePersister();
  const timer = createFakeTimer();
  const scheduler = createDraftScheduler<FakeState>(persister, {
    key: "diag/demo",
    debounceMs: 3000,
    now: timer.now,
    setTimer: timer.setTimer,
    clearTimer: timer.clearTimer,
  });

  scheduler.scheduleSave({ value: "a" });
  timer.advance(1000);
  assert.equal(persister.store.get("diag/demo"), undefined, "nada escrito antes do prazo");

  timer.advance(3000);
  assert.deepEqual(persister.store.get("diag/demo"), { value: "a" });
});

test("scheduleSave reagenda: última digitada é a que grava", () => {
  const persister = createFakePersister();
  const timer = createFakeTimer();
  const scheduler = createDraftScheduler<FakeState>(persister, {
    key: "diag/reagenda",
    debounceMs: 3000,
    now: timer.now,
    setTimer: timer.setTimer,
    clearTimer: timer.clearTimer,
  });

  scheduler.scheduleSave({ value: "a" });
  timer.advance(2000);
  scheduler.scheduleSave({ value: "ab" });
  timer.advance(2000);
  // Ainda dentro do debounce da segunda chamada
  assert.equal(persister.store.get("diag/reagenda"), undefined);

  timer.advance(3000);
  assert.deepEqual(persister.store.get("diag/reagenda"), { value: "ab" });
});

test("flush persiste rascunho pendente na hora, sem esperar debounce", () => {
  const persister = createFakePersister();
  const timer = createFakeTimer();
  const scheduler = createDraftScheduler<FakeState>(persister, {
    key: "diag/flush",
    setTimer: timer.setTimer,
    clearTimer: timer.clearTimer,
  });

  scheduler.scheduleSave({ value: "final" });
  scheduler.flush();
  assert.deepEqual(persister.store.get("diag/flush"), { value: "final" });
  assert.equal(scheduler.getPendingState(), null);
});

test("cancel descarta rascunho sem gravar", () => {
  const persister = createFakePersister();
  const timer = createFakeTimer();
  const scheduler = createDraftScheduler<FakeState>(persister, {
    key: "diag/cancel",
    setTimer: timer.setTimer,
    clearTimer: timer.clearTimer,
  });

  scheduler.scheduleSave({ value: "nunca" });
  scheduler.cancel();
  timer.advance(10000);
  assert.equal(persister.store.get("diag/cancel"), undefined);
  assert.equal(scheduler.getPendingState(), null);
});

test("scheduleSave duas vezes com mesmo conteúdo — última vence, só uma escrita", () => {
  const persister = createFakePersister();
  const timer = createFakeTimer();
  let writes = 0;
  const wrapped: DraftPersister<FakeState> = {
    ...persister,
    write: (k, s) => { writes += 1; persister.write(k, s); },
  };
  const scheduler = createDraftScheduler<FakeState>(wrapped, {
    key: "diag/idempotent",
    debounceMs: 3000,
    setTimer: timer.setTimer,
    clearTimer: timer.clearTimer,
  });

  scheduler.scheduleSave({ value: "x" });
  scheduler.scheduleSave({ value: "x" });
  scheduler.scheduleSave({ value: "x" });
  timer.advance(3000);
  assert.equal(writes, 1);
});
