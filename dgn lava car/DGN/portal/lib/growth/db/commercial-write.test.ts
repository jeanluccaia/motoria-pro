import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateAdminSessionToken } from "../admin-session.ts";
import { handleCommercialPatch } from "./commercial-route.ts";
import { CommercialWriteError, updateCommercialFields, validateCommercialPayload } from "./commercial-write.ts";
import { mapGrowthSnapshot, type GrowthDbSnapshot } from "./growth-reader.ts";

const validPayload = {
  owner: "  Rodrigo   Silva  ",
  commercialNotes: "Contato comercial\r\nem validação",
  nextAction: " Confirmar   interesse no plano ",
  nextActionAt: "2026-08-01T15:00:00-03:00",
  priority: "alta",
  expectedUpdatedAt: "2026-07-17T03:04:36.113111Z",
};

function request(payload: unknown) {
  return { cookies: { get: () => undefined }, json: async () => payload };
}

async function body(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

test("rota rejeita ausência de sessão antes de escrever", async () => {
  let writes = 0;
  const response = await handleCommercialPatch(request(validPayload), "iara", {
    authorize: async () => false,
    source: "db",
    write: async () => { writes += 1; throw new Error("não deveria executar"); },
  });
  assert.equal(response.status, 401);
  assert.equal(writes, 0);
  assert.equal(await validateAdminSessionToken(undefined, "senha"), false);
});

test("validação rejeita payload inválido, campo extra, prioridade e data inválidas", () => {
  assert.throws(() => validateCommercialPayload(null), /payload inválido/);
  assert.throws(() => validateCommercialPayload({ ...validPayload, founderStatus: "confirmado" }), /campos não permitidos/);
  assert.throws(() => validateCommercialPayload({ ...validPayload, priority: "máxima" }), /priority deve ser/);
  assert.throws(() => validateCommercialPayload({ ...validPayload, nextActionAt: "amanhã" }), /data\/hora ISO/);
  assert.throws(() => validateCommercialPayload({ ...validPayload, commercialNotes: "<script>alert(1)<\/script>" }), /não aceita HTML/);
});

test("update válido normaliza texto, UTC e retorna estado final", async () => {
  let received: ReturnType<typeof validateCommercialPayload> | undefined;
  const final = { owner: "Rodrigo Silva", commercialNotes: "Contato comercial\nem validação", nextAction: "Confirmar interesse no plano", nextActionAt: "2026-08-01T18:00:00.000Z", priority: "alta" as const, updatedAt: "2026-07-18T00:00:00Z" };
  const response = await handleCommercialPatch(request(validPayload), "iara", {
    authorize: async () => true,
    source: "db",
    write: async (_id, input) => { received = input; return { changed: true, customerId: "iara", commercial: final }; },
  });
  assert.equal(response.status, 200);
  assert.equal(received?.owner, "Rodrigo Silva");
  assert.equal(received?.nextAction, "Confirmar interesse no plano");
  assert.equal(received?.nextActionAt, "2026-08-01T18:00:00.000Z");
  assert.deepEqual((await body(response)).commercial, final);
});

test("cliente inexistente e erro remoto são controlados", async () => {
  const notFound = await handleCommercialPatch(request(validPayload), "inexistente", {
    authorize: async () => true, source: "db",
    write: async () => { throw new CommercialWriteError("Cliente ou registro comercial inexistente.", 404); },
  });
  assert.equal(notFound.status, 404);
  const remote = { rpc: async () => ({ data: null, error: { code: "XX000", message: "detalhe interno" } }) } as never;
  await assert.rejects(updateCommercialFields("iara", validateCommercialPayload(validPayload), remote), (error: unknown) => error instanceof CommercialWriteError && error.status === 502 && !error.message.includes("detalhe interno"));
});

test("modo JSON nunca chama escrita", async () => {
  let writes = 0;
  const response = await handleCommercialPatch(request(validPayload), "iara", {
    authorize: async () => true, source: "json",
    write: async () => { writes += 1; throw new Error("não deveria executar"); },
  });
  assert.equal(response.status, 409); assert.equal(writes, 0);
});

test("service role ausente produz erro controlável no servidor", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    await assert.rejects(updateCommercialFields("iara", validateCommercialPayload(validPayload)), /Supabase administrativo não configurado/);
  } finally {
    if (previousUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey) process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("migration faz no-op sem auditoria e audita valores anterior/novo atomicamente", async () => {
  const sql = await readFile(new URL("../../../db/migrations/0003_commercial_customer_fields.sql", import.meta.url), "utf8");
  const noop = sql.indexOf("if not v_changed then");
  const audit = sql.indexOf("insert into public.crm_audit_logs");
  assert.ok(noop >= 0 && audit > noop);
  assert.match(sql, /'commercial_fields\.updated'/);
  assert.match(sql, /v_previous,\s+v_next/);
  assert.match(sql, /p_expected_updated_at/);
});

test("mapper preserva os campos após reload", () => {
  const snapshot: GrowthDbSnapshot = {
    customers: [{ id: "uuid-iara", legacy_id: "iara", name: "Iara Menezes" }],
    vehicles: [], subscriptions: [], interactions: [], scores: [],
    campaignMembers: [{ customer_id: "uuid-iara", campaign_id: "founders-2026", owner: "Rodrigo", commercial_notes: "Contato", next_action: "Confirmar", next_action_at: "2026-08-01T18:00:00Z", priority: 3, updated_at: "2026-07-18T00:00:00Z" }],
  };
  const commercial = mapGrowthSnapshot(snapshot)[0].commercial;
  assert.deepEqual(commercial, { owner: "Rodrigo", commercialNotes: "Contato", nextAction: "Confirmar", nextActionAt: "2026-08-01T18:00:00Z", priority: "alta", updatedAt: "2026-07-18T00:00:00Z" });
});
