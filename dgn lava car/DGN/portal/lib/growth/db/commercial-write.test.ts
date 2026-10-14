import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
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

// ---------------------------------------------------------------------------
// Fake Supabase client que suporta tanto o resolver (db.from(...).select(...)
// .eq(...).maybeSingle()) quanto o rpc(). Reproduz o fluxo real: resolver
// primeiro, RPC depois. Permite captar o nome e os args da RPC chamada.
// ---------------------------------------------------------------------------
interface Customer { id: string; legacy_id: string | null }
type RpcHandler = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown | null }>;

function buildFakeClient(customers: Customer[], rpc: RpcHandler): SupabaseClient {
  const startQuery = (rows: Customer[]) => {
    const filters: Array<{ column: keyof Customer; value: unknown }> = [];
    const chain: Record<string, unknown> = {
      eq: (column: string, value: unknown) => {
        filters.push({ column: column as keyof Customer, value });
        return chain;
      },
      maybeSingle: async () => {
        let filtered = rows.slice();
        for (const filter of filters) {
          filtered = filtered.filter((row) => row[filter.column] === filter.value);
        }
        return { data: (filtered[0] ?? null) as unknown, error: null };
      },
    };
    return chain;
  };
  const fake = {
    from(table: string) {
      if (table !== "crm_customers") throw new Error(`table ${table} n/i`);
      return { select: (_cols: string) => startQuery(customers) };
    },
    rpc: (fn: string, args: Record<string, unknown>) => rpc(fn, args),
  };
  return fake as unknown as SupabaseClient;
}

const VIVIANE_UUID = "47e85bf5-85de-456f-b90d-753e295ccaf1";
const IARA_UUID = "d20b70c4-a98b-4eb7-9a24-25cd355bf787";
const RIKARDO_UUID = "cb55686f-29dc-470d-8ce3-cf271ecbebac";

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

test("validação rejeita owner vazio ou só espaços com mensagem clara", () => {
  assert.throws(() => validateCommercialPayload({ ...validPayload, owner: "" }), /owner é obrigatório/);
  assert.throws(() => validateCommercialPayload({ ...validPayload, owner: "   " }), /owner é obrigatório/);
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
  // Erro remoto genérico da RPC retorna 502 sem vazar detalhe interno.
  // Alimenta o resolver com um UUID válido para o fake aceitar e exercitar o path da RPC.
  const remote = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async () => ({ data: null, error: { code: "XX000", message: "detalhe interno" } as unknown }),
  );
  await assert.rejects(
    updateCommercialFields("iara", validateCommercialPayload(validPayload), remote),
    (error: unknown) => error instanceof CommercialWriteError && error.status === 502 && !error.message.includes("detalhe interno"),
  );
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

test("migration original (0003) mantém no-op sem auditoria e audita atomicamente", async () => {
  const sql = await readFile(new URL("../../../db/migrations/0003_commercial_customer_fields.sql", import.meta.url), "utf8");
  const noop = sql.indexOf("if not v_changed then");
  const audit = sql.indexOf("insert into public.crm_audit_logs");
  assert.ok(noop >= 0 && audit > noop);
  assert.match(sql, /'commercial_fields\.updated'/);
  assert.match(sql, /v_previous,\s+v_next/);
  assert.match(sql, /p_expected_updated_at/);
});

test("migration 20261012 passa a aceitar p_customer_id uuid e preserva invariantes", async () => {
  // Nome do arquivo bate com o version registrado em supabase_migrations.schema_migrations:
  // 20261012203945 | commercial_fields_uuid_canonical (apply via MCP em prod 2026-10-12).
  const sql = await readFile(
    new URL("../../../db/migrations/20261012203945_commercial_fields_uuid_canonical.sql", import.meta.url),
    "utf8",
  );
  // Assinatura canônica (UUID como id primário).
  assert.match(sql, /p_customer_id uuid/);
  // Filtro agora é por id canônico, não por legacy_id.
  assert.match(sql, /where id = p_customer_id/);
  // Mantém o padrão de no-op + audit (invariantes do schema anterior).
  const noop = sql.indexOf("if not v_changed then");
  const audit = sql.indexOf("insert into public.crm_audit_logs");
  assert.ok(noop >= 0 && audit > noop, "no-op precede o insert do audit log");
  assert.match(sql, /'commercial_fields\.updated'/);
  assert.match(sql, /v_previous,\s+v_next/);
  // Bootstrap silencioso continua existindo (prospect sem campaign_member).
  assert.match(sql, /bootstrap=true/);
  // Grants: só service_role; publico/anon/authenticated são revogados.
  assert.match(sql, /revoke all on function[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function[\s\S]*to service_role/);
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

// ---------------------------------------------------------------------------
// LOTE A — regressão: UUID direto, slug, legacy_id=null, impedir update em
// customer errado, erro humano para cliente inexistente. Casos obrigatórios
// nomeados no brief: Viviane (UUID + legacy_id null), Rikardo (slug), Iara
// (slug).
// ---------------------------------------------------------------------------

test("UUID canônico (Viviane) resolve e chama RPC com p_customer_id", async () => {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client = buildFakeClient(
    [{ id: VIVIANE_UUID, legacy_id: null }],
    async (fn, args) => {
      calls.push({ fn, args });
      return {
        data: {
          changed: true,
          customerId: VIVIANE_UUID,
          commercial: {
            owner: "Rodrigo Silva", commercialNotes: "", nextAction: "", nextActionAt: null,
            priority: "alta", updatedAt: "2026-10-12T00:00:00Z", bootstrapped: true,
          },
        },
        error: null,
      };
    },
  );
  const result = await updateCommercialFields(VIVIANE_UUID, validateCommercialPayload(validPayload), client);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].fn, "crm_update_customer_commercial_fields");
  assert.equal(calls[0].args.p_customer_id, VIVIANE_UUID);
  assert.equal((calls[0].args as { p_customer_legacy_id?: string }).p_customer_legacy_id, undefined);
  assert.equal(result.customerId, VIVIANE_UUID);
});

test("slug (Rikardo) resolve para UUID canônico antes da RPC", async () => {
  const calls: Array<{ args: Record<string, unknown> }> = [];
  const client = buildFakeClient(
    [{ id: RIKARDO_UUID, legacy_id: "rikardo-oliveira" }],
    async (_fn, args) => {
      calls.push({ args });
      return {
        data: {
          changed: true, customerId: RIKARDO_UUID,
          commercial: { owner: "Rodrigo Silva", commercialNotes: "", nextAction: "", nextActionAt: null, priority: "alta", updatedAt: "2026-10-12T00:00:00Z" },
        },
        error: null,
      };
    },
  );
  await updateCommercialFields("rikardo-oliveira", validateCommercialPayload(validPayload), client);
  assert.equal(calls[0].args.p_customer_id, RIKARDO_UUID);
});

test("slug (Iara) continua funcionando — compat para legacy_id existentes", async () => {
  const client = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async (_fn, args) => ({
      data: {
        changed: false, customerId: args.p_customer_id,
        commercial: { owner: "Rodrigo", commercialNotes: "", nextAction: "", nextActionAt: null, priority: "alta", updatedAt: "2026-07-18T00:00:00Z" },
      },
      error: null,
    }),
  );
  const result = await updateCommercialFields("iara", validateCommercialPayload(validPayload), client);
  assert.equal(result.customerId, IARA_UUID);
});

test("slug inexistente → 404 humano (não 'invalid input syntax for type uuid')", async () => {
  const client = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async () => ({ data: null, error: null }),
  );
  await assert.rejects(
    updateCommercialFields("fulano-inexistente", validateCommercialPayload(validPayload), client),
    (error: unknown) =>
      error instanceof CommercialWriteError &&
      error.status === 404 &&
      error.message === "Cliente ou registro comercial inexistente.",
  );
});

test("UUID válido mas inexistente → 404 humano", async () => {
  const client = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async () => ({ data: null, error: null }),
  );
  await assert.rejects(
    updateCommercialFields("ffffffff-ffff-4fff-8fff-ffffffffffff", validateCommercialPayload(validPayload), client),
    (error: unknown) =>
      error instanceof CommercialWriteError &&
      error.status === 404 &&
      error.message === "Cliente ou registro comercial inexistente.",
  );
});

test("RPC devolve P0002 → 404 humano com mesma mensagem", async () => {
  const client = buildFakeClient(
    [{ id: VIVIANE_UUID, legacy_id: null }],
    async () => ({ data: null, error: { code: "P0002", message: "cliente inexistente" } }),
  );
  await assert.rejects(
    updateCommercialFields(VIVIANE_UUID, validateCommercialPayload(validPayload), client),
    (error: unknown) =>
      error instanceof CommercialWriteError &&
      error.status === 404 &&
      error.message === "Cliente ou registro comercial inexistente.",
  );
});

test("concorrência otimista (40001) vira 409 humano", async () => {
  const client = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async () => ({ data: null, error: { code: "40001", message: "registro alterado por outra sessão" } }),
  );
  await assert.rejects(
    updateCommercialFields("iara", validateCommercialPayload(validPayload), client),
    (error: unknown) => error instanceof CommercialWriteError && error.status === 409,
  );
});

test("validação do banco (22023) propaga mensagem como 400", async () => {
  const client = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async () => ({ data: null, error: { code: "22023", message: "responsável inválido" } }),
  );
  await assert.rejects(
    updateCommercialFields("iara", validateCommercialPayload(validPayload), client),
    (error: unknown) =>
      error instanceof CommercialWriteError && error.status === 400 && /responsável inválido/.test(error.message),
  );
});

test("input vazio no customerId é rejeitado pelo resolver antes de qualquer rpc", async () => {
  let rpcCalls = 0;
  const client = buildFakeClient(
    [{ id: VIVIANE_UUID, legacy_id: null }],
    async () => { rpcCalls += 1; return { data: null, error: null }; },
  );
  await assert.rejects(
    updateCommercialFields("", validateCommercialPayload(validPayload), client),
    (error: unknown) => error instanceof CommercialWriteError && error.status === 400,
  );
  assert.equal(rpcCalls, 0);
});

test("save → RPC retorna commercial com updatedAt — simula round-trip reload", async () => {
  const freshUpdatedAt = "2026-10-12T12:34:56.000Z";
  const client = buildFakeClient(
    [{ id: VIVIANE_UUID, legacy_id: null }],
    async (_fn, args) => ({
      data: {
        changed: true,
        customerId: args.p_customer_id,
        commercial: {
          owner: args.p_owner, commercialNotes: args.p_commercial_notes, nextAction: args.p_next_action,
          nextActionAt: args.p_next_action_at, priority: "alta", updatedAt: freshUpdatedAt,
        },
      },
      error: null,
    }),
  );
  const result = await updateCommercialFields(VIVIANE_UUID, validateCommercialPayload(validPayload), client);
  assert.equal(result.commercial.updatedAt, freshUpdatedAt);
  assert.equal(result.commercial.owner, "Rodrigo Silva");
});

// ---------------------------------------------------------------------------
// LOTE A — regressão no-op idêntico (hipótese Iara): a RPC devolve changed=false
// quando o payload bate exatamente com o estado atual + expected_updated_at
// correto. Esperado: um único RPC call, nenhum insert de audit, response 200
// com body.changed=false. É esse body que o cliente usa pra renderizar
// "Nenhuma alteração; nada a auditar.".
// ---------------------------------------------------------------------------

test("no-op Iara: payload idêntico + expected_updated_at correto → changed=false, 1 RPC call", async () => {
  // Formato já normalizado (new Date().toISOString()); o validator reemite nesse formato.
  const existingUpdatedAt = "2026-07-18T00:00:00.000Z";
  const identicalPayload = { ...validPayload, expectedUpdatedAt: existingUpdatedAt };
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client = buildFakeClient(
    [{ id: IARA_UUID, legacy_id: "iara" }],
    async (fn, args) => {
      calls.push({ fn, args });
      // Mesma forma que a RPC real devolve quando v_changed=false (linhas 125-131
      // da migration 20261012203945_commercial_fields_uuid_canonical.sql):
      // retorna o commercial atual com o updatedAt preservado, SEM audit log.
      return {
        data: {
          changed: false,
          customerId: args.p_customer_id,
          commercial: {
            owner: args.p_owner,
            commercialNotes: args.p_commercial_notes,
            nextAction: args.p_next_action,
            nextActionAt: args.p_next_action_at,
            priority: "alta",
            updatedAt: existingUpdatedAt,
            bootstrapped: false,
          },
        },
        error: null,
      };
    },
  );
  const result = await updateCommercialFields("iara", validateCommercialPayload(identicalPayload), client);
  assert.equal(calls.length, 1, "RPC deve ser chamada exatamente uma vez");
  assert.equal(calls[0].fn, "crm_update_customer_commercial_fields");
  assert.equal(calls[0].args.p_customer_id, IARA_UUID, "resolver deve ter traduzido slug → UUID antes da RPC");
  assert.equal(calls[0].args.p_expected_updated_at, existingUpdatedAt);
  assert.equal(result.changed, false, "no-op não deve reportar changed=true");
  assert.equal(result.commercial.updatedAt, existingUpdatedAt, "updatedAt preservado — nenhum trigger disparou");
});

// ---------------------------------------------------------------------------
// LOTE A — regressão timeout preview: se a RPC pendurar além de rpcTimeoutMs,
// o AbortController server-side mata o await e lança CommercialWriteError(504).
// Garante que a função nunca fica pendurada indefinidamente no preview
// (prod continua passando rpcTimeoutMs=0 → caminho sem AbortSignal).
// ---------------------------------------------------------------------------

test("timeout preview: RPC pendura além de rpcTimeoutMs → CommercialWriteError 504, nenhum sucesso falso", async () => {
  // Fake chainable: db.rpc(...).abortSignal(sig) devolve uma Promise que
  // rejeita com DOMException("AbortError") quando o signal dispara, antes de
  // qualquer resolução "feliz".
  let abortSeen = false;
  const client = {
    from(table: string) {
      if (table !== "crm_customers") throw new Error(`table ${table} n/i`);
      return {
        select: (_cols: string) => {
          const chain: Record<string, unknown> = {
            eq: () => chain,
            maybeSingle: async () => ({ data: { id: IARA_UUID, legacy_id: "iara" }, error: null }),
          };
          return chain;
        },
      };
    },
    rpc(_fn: string, _args: Record<string, unknown>) {
      // Promise que pendura "para sempre" até receber abort via chain.
      let abortReject: ((reason: unknown) => void) | null = null;
      const base = new Promise<{ data: unknown; error: unknown | null }>((_resolve, reject) => {
        abortReject = reject;
      });
      const chain = Object.assign(base, {
        abortSignal(signal: AbortSignal) {
          const fire = () => {
            abortSeen = true;
            abortReject?.(new DOMException("The operation was aborted", "AbortError"));
          };
          if (signal.aborted) fire();
          else signal.addEventListener("abort", fire, { once: true });
          return base;
        },
      });
      return chain;
    },
  } as unknown as SupabaseClient;

  const start = Date.now();
  await assert.rejects(
    updateCommercialFields(
      "iara",
      validateCommercialPayload(validPayload),
      client,
      { requestId: "test-rid", rpcTimeoutMs: 50 },
    ),
    (error: unknown) =>
      error instanceof CommercialWriteError
      && error.status === 504
      && /Timeout de diagnóstico/.test(error.message),
  );
  const elapsed = Date.now() - start;
  assert.ok(abortSeen, "AbortSignal deve ter disparado");
  assert.ok(elapsed < 1_000, `rejeição deve vir rápido (${elapsed}ms) — safety net, não espera a RPC real`);
});
