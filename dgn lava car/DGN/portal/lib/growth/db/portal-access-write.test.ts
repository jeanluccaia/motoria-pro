import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PortalAccessError,
  disablePortalAccess,
  maskEmail,
  normalizeEmail,
  provisionPortalAccess,
  readPortalAccessStatus,
  resendPortalAccess,
} from "./portal-access-write.ts";

// -----------------------------------------------------------------------------
// FakeSupabase — reproduz apenas o subset de operações que
// portal-access-write.ts consome, com estado in-memory. Cobre os 10 cenários
// pedidos pelo brief sem depender do Postgres real.
// -----------------------------------------------------------------------------

interface State {
  customers: Array<{ id: string; legacy_id: string | null; name: string; email: string | null; portal_beta_enabled: boolean; portal_beta_enabled_at: string | null }>;
  subscriptions: Array<{ id: string; customer_id: string }>;
  links: Array<{ auth_user_id: string; customer_id: string }>;
  authUsers: Array<{ id: string; email: string }>;
  audit: Array<Record<string, unknown>>;
  createUserCalls: number;
}

function buildFake(state: State): SupabaseClient {
  function tableFrom(schemaName: string, table: string): Record<string, unknown> {
    if (schemaName !== "public" && schemaName !== "auth") throw new Error(`schema ${schemaName} n/i`);

    const q = <T>(rows: T[]): Record<string, unknown> => {
      const filters: Array<{ column: string; op: "eq" | "neq"; value: unknown }> = [];
      let opts: { count?: "exact"; head?: boolean; single?: boolean; maybeSingle?: boolean; limit?: number } = {};
      const executor: () => Promise<{ data: unknown; error: null | { message: string; code?: string }; count?: number }> = async () => {
        let filtered: T[] = rows.slice();
        for (const filter of filters) {
          filtered = filtered.filter((row) => {
            const value = (row as Record<string, unknown>)[filter.column];
            return filter.op === "eq" ? value === filter.value : value !== filter.value;
          });
        }
        if (opts.head) return { data: null, error: null, count: filtered.length };
        if (opts.limit != null) filtered = filtered.slice(0, opts.limit);
        if (opts.single) {
          if (filtered.length !== 1) return { data: null, error: { message: "not single", code: "PGRST116" } };
          return { data: filtered[0] as unknown, error: null };
        }
        if (opts.maybeSingle) {
          if (filtered.length > 1) return { data: null, error: { message: "multiple", code: "PGRST116" } };
          return { data: (filtered[0] ?? null) as unknown, error: null };
        }
        return { data: filtered as unknown, error: null };
      };
      const chain: Record<string, unknown> = {
        select(_cols: string, options?: { count?: "exact"; head?: boolean }) {
          if (options?.count) opts = { ...opts, count: options.count, head: options.head };
          return chain;
        },
        eq(column: string, value: unknown) { filters.push({ column, op: "eq", value }); return chain; },
        neq(column: string, value: unknown) { filters.push({ column, op: "neq", value }); return chain; },
        limit(n: number) { opts = { ...opts, limit: n }; return chain; },
        single() { opts = { ...opts, single: true }; return executor(); },
        maybeSingle() { opts = { ...opts, maybeSingle: true }; return executor(); },
        then(resolve: (v: Awaited<ReturnType<typeof executor>>) => unknown) { return executor().then(resolve); },
      };
      return chain;
    };

    if (schemaName === "auth" && table === "users") {
      return q(state.authUsers);
    }

    if (table === "crm_customers") {
      const base: Record<string, unknown> = {
        select: (_cols: string, options?: { count?: "exact"; head?: boolean }) => (q(state.customers).select as (c: string, o?: unknown) => unknown)(_cols, options),
        update: (patch: Partial<State["customers"][number]>) => {
          const filters: Array<{ column: string; value: unknown }> = [];
          let selectSingle = false;
          const chain: Record<string, unknown> = {
            eq(column: string, value: unknown) { filters.push({ column, value }); return chain; },
            select() { return chain; },
            single() { selectSingle = true; return exec(); },
            then(resolve: (v: unknown) => unknown) { return exec().then(resolve); },
          };
          const exec = async () => {
            let updated: typeof state.customers[number] | undefined;
            for (const customer of state.customers) {
              if (filters.every((f) => (customer as Record<string, unknown>)[f.column] === f.value)) {
                Object.assign(customer, patch);
                updated = customer;
              }
            }
            if (selectSingle) return { data: updated, error: null };
            return { data: updated, error: null };
          };
          return chain;
        },
      };
      return base;
    }

    if (table === "crm_subscriptions") {
      return q(state.subscriptions);
    }

    if (table === "crm_customer_auth") {
      const base: Record<string, unknown> = {
        select: (cols: string, options?: { count?: "exact"; head?: boolean }) => (q(state.links).select as (c: string, o?: unknown) => unknown)(cols, options),
        insert: async (row: { auth_user_id: string; customer_id: string }) => {
          if (state.links.some((link) => link.auth_user_id === row.auth_user_id || link.customer_id === row.customer_id)) {
            return { error: { message: "unique violation" } };
          }
          state.links.push(row);
          return { error: null };
        },
      };
      return base;
    }

    if (table === "crm_audit_logs") {
      return {
        insert: async (row: Record<string, unknown>) => { state.audit.push(row); return { error: null }; },
      } as unknown as ReturnType<typeof tableFrom>;
    }

    throw new Error(`fake: tabela ${table} n/i`);
  }

  const client = {
    from(table: string) { return tableFrom("public", table); },
    schema(name: string) { return { from(table: string) { return tableFrom(name, table); } }; },
    auth: {
      admin: {
        createUser: async (payload: { email: string }) => {
          state.createUserCalls += 1;
          const id = `auth-${state.authUsers.length + 1}`;
          state.authUsers.push({ id, email: payload.email });
          return { data: { user: { id } }, error: null };
        },
        // Fake da Admin API: devolve todos os users no formato page/perPage.
        listUsers: async ({ page: _page, perPage: _perPage }: { page: number; perPage: number }) => {
          return { data: { users: state.authUsers.slice() }, error: null };
        },
      },
    },
  } as unknown as SupabaseClient;

  return client;
}

function baseState(): State {
  return {
    customers: [
      { id: "cust-1", legacy_id: "gustavo-plensack", name: "Gustavo Plensack", email: null, portal_beta_enabled: false, portal_beta_enabled_at: null },
      { id: "cust-2", legacy_id: null, name: "Outro Cliente", email: null, portal_beta_enabled: false, portal_beta_enabled_at: null },
      { id: "cust-3", legacy_id: "sem-assinatura", name: "Sem Assinatura", email: null, portal_beta_enabled: false, portal_beta_enabled_at: null },
    ],
    subscriptions: [
      { id: "sub-1", customer_id: "cust-1" },
      { id: "sub-2", customer_id: "cust-2" },
      // cust-3 propositalmente sem subscription
    ],
    links: [],
    authUsers: [],
    audit: [],
    createUserCalls: 0,
  };
}

// -----------------------------------------------------------------------------
// Cenário 1 + 2 + 3 + 8: cliente novo, e-mail válido → cria auth, vínculo, gate
// -----------------------------------------------------------------------------

test("provision cria Auth user, vínculo e habilita gate", async () => {
  const state = baseState();
  const db = buildFake(state);
  let sent: string | null = null;
  const result = await provisionPortalAccess({
    customerId: "gustavo-plensack",
    email: "  Gustavo@Test.com ",
    actor: "digo",
    db,
    sendMagicLink: async (email) => { sent = email; return { ok: true, status: 200 }; },
  });
  assert.equal(result.customerId, "cust-1");
  assert.equal(state.createUserCalls, 1);
  assert.equal(state.authUsers[0]?.email, "gustavo@test.com");
  assert.equal(state.links.length, 1);
  assert.equal(state.links[0]?.customer_id, "cust-1");
  assert.equal(state.customers[0]?.portal_beta_enabled, true);
  assert.equal(state.customers[0]?.email, "gustavo@test.com");
  assert.equal(sent, "gustavo@test.com");
  assert.equal(result.magicLinkSent, true);
  assert.equal(state.audit.at(-1)?.action, "portal_access.granted");
});

// -----------------------------------------------------------------------------
// Cenário 5: e-mail já pertence ao mesmo customer → OK (idempotência)
// -----------------------------------------------------------------------------

test("provision idempotente quando cliente já tem Auth + gate", async () => {
  const state = baseState();
  state.customers[0]!.email = "gustavo@test.com";
  state.customers[0]!.portal_beta_enabled = true;
  state.customers[0]!.portal_beta_enabled_at = "2026-09-01T00:00:00Z";
  state.authUsers.push({ id: "auth-old", email: "gustavo@test.com" });
  state.links.push({ auth_user_id: "auth-old", customer_id: "cust-1" });
  const db = buildFake(state);
  const result = await provisionPortalAccess({
    customerId: "gustavo-plensack",
    email: "gustavo@test.com",
    actor: "digo",
    db,
    sendMagicLink: async () => ({ ok: true, status: 200 }),
  });
  assert.equal(result.reused, true);
  assert.equal(state.createUserCalls, 0);
  assert.equal(state.links.length, 1);
  assert.equal(state.audit.at(-1)?.action, "portal_access.granted");
});

// -----------------------------------------------------------------------------
// Cenário 6: e-mail pertence a outro customer → BLOCK
// -----------------------------------------------------------------------------

test("provision bloqueia e-mail já usado por outro customer", async () => {
  const state = baseState();
  state.customers[1]!.email = "cliente@outro.com";
  const db = buildFake(state);
  await assert.rejects(
    () => provisionPortalAccess({ customerId: "gustavo-plensack", email: "cliente@outro.com", actor: "digo", db, sendMagicLink: async () => ({ ok: true, status: 200 }) }),
    (error: unknown) => error instanceof PortalAccessError && error.status === 409 && /outro cliente/i.test(error.message),
  );
  assert.equal(state.audit.length, 0);
});

test("provision bloqueia auth user já vinculado a outro customer", async () => {
  const state = baseState();
  state.authUsers.push({ id: "auth-x", email: "alguem@dgn.com" });
  state.links.push({ auth_user_id: "auth-x", customer_id: "cust-2" });
  const db = buildFake(state);
  await assert.rejects(
    () => provisionPortalAccess({ customerId: "gustavo-plensack", email: "alguem@dgn.com", actor: "digo", db, sendMagicLink: async () => ({ ok: true, status: 200 }) }),
    (error: unknown) => error instanceof PortalAccessError && error.status === 409 && /outro assinante/i.test(error.message),
  );
});

// -----------------------------------------------------------------------------
// Cenário 7: customer sem assinatura → BLOCK
// -----------------------------------------------------------------------------

test("provision bloqueia customer sem assinatura registrada", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => provisionPortalAccess({ customerId: "sem-assinatura", email: "novo@dgn.com", actor: "digo", db, sendMagicLink: async () => ({ ok: true, status: 200 }) }),
    (error: unknown) => error instanceof PortalAccessError && error.status === 409 && /sem assinatura/i.test(error.message),
  );
});

// -----------------------------------------------------------------------------
// Cenário 4: reenvio idempotente — reutiliza vínculo + Auth existentes
// -----------------------------------------------------------------------------

test("resend reaproveita Auth existente sem criar nada novo", async () => {
  const state = baseState();
  state.customers[0]!.email = "gustavo@test.com";
  state.customers[0]!.portal_beta_enabled = true;
  state.authUsers.push({ id: "auth-old", email: "gustavo@test.com" });
  state.links.push({ auth_user_id: "auth-old", customer_id: "cust-1" });
  const db = buildFake(state);
  let sent: string | null = null;
  const result = await resendPortalAccess("gustavo-plensack", "digo", db, async (email) => { sent = email; return { ok: true, status: 200 }; });
  assert.equal(result.magicLinkSent, true);
  assert.equal(sent, "gustavo@test.com");
  assert.equal(state.createUserCalls, 0);
  assert.equal(state.links.length, 1);
  assert.equal(state.audit.at(-1)?.action, "portal_access.resent");
});

test("resend bloqueia quando cliente ainda não tem Auth", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => resendPortalAccess("gustavo-plensack", "digo", db, async () => ({ ok: true, status: 200 })),
    (error: unknown) => error instanceof PortalAccessError && error.status === 409,
  );
});

// -----------------------------------------------------------------------------
// Cenário 9: desabilitar fecha gate mas mantém dados
// -----------------------------------------------------------------------------

test("disable põe portal_beta_enabled=false sem apagar Auth ou vínculo", async () => {
  const state = baseState();
  state.customers[0]!.email = "gustavo@test.com";
  state.customers[0]!.portal_beta_enabled = true;
  state.authUsers.push({ id: "auth-old", email: "gustavo@test.com" });
  state.links.push({ auth_user_id: "auth-old", customer_id: "cust-1" });
  const db = buildFake(state);
  const result = await disablePortalAccess("gustavo-plensack", "digo", db);
  assert.equal(result.enabled, false);
  assert.equal(state.customers[0]?.portal_beta_enabled, false);
  assert.equal(state.customers[0]?.email, "gustavo@test.com");
  assert.equal(state.authUsers.length, 1);
  assert.equal(state.links.length, 1);
  assert.equal(state.audit.at(-1)?.action, "portal_access.disabled");
});

// -----------------------------------------------------------------------------
// Status snapshot: para a UI decidir "não liberado" vs "ativo"
// -----------------------------------------------------------------------------

test("readPortalAccessStatus reflete o estado atual", async () => {
  const state = baseState();
  state.customers[0]!.email = "gustavo@test.com";
  state.customers[0]!.portal_beta_enabled = true;
  state.authUsers.push({ id: "auth-old", email: "gustavo@test.com" });
  state.links.push({ auth_user_id: "auth-old", customer_id: "cust-1" });
  const status = await readPortalAccessStatus("gustavo-plensack", buildFake(state));
  assert.equal(status.enabled, true);
  assert.equal(status.hasAuth, true);
  assert.equal(status.hasSubscription, true);
  assert.equal(status.emailMasked, "gu*****@test.com");
});

// -----------------------------------------------------------------------------
// Utilitários puros
// -----------------------------------------------------------------------------

test("normalizeEmail rejeita formatos inválidos", () => {
  assert.throws(() => normalizeEmail(""), /obrigatório/);
  assert.throws(() => normalizeEmail("sem-arroba"), /inválido/);
  assert.throws(() => normalizeEmail("a@b.c"), /inválido/);
  assert.throws(() => normalizeEmail(123 as unknown as string), /obrigatório/);
  assert.equal(normalizeEmail("  Foo@Bar.COM "), "foo@bar.com");
});

test("maskEmail preserva prefixo mínimo", () => {
  assert.equal(maskEmail("gustavo@test.com"), "gu*****@test.com");
  assert.equal(maskEmail("jose@x.com"), "jo**@x.com");
  assert.equal(maskEmail(null), null);
});

// -----------------------------------------------------------------------------
// Cenário 10: service_role nunca chega ao client bundle
//
// Regra dura: nenhum módulo importado pelo componente client pode importar
// `admin-client.ts`, `audit.ts`, `portal-access-write.ts` ou similar. Se o
// grep encontrar tais imports em code path client, falha. Como Next.js já
// bloqueia isso via `import "server-only"`, aqui só confirmamos que os módulos
// server carregam o marker e que o componente client NÃO importa nenhum deles.
// -----------------------------------------------------------------------------

test("service_role fica preso ao server bundle", async () => {
  const write = await readFile(new URL("./portal-access-write.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("./portal-access-route.ts", import.meta.url), "utf8");
  assert.match(write, /^import "server-only";/m);
  assert.match(route, /^import "server-only";/m);

  const workspaceUrl = new URL("../../../components/growth/DgnGrowthWorkspace.tsx", import.meta.url);
  const workspace = await readFile(workspaceUrl, "utf8");
  assert.equal(workspace.trimStart().startsWith('"use client"'), true);
  assert.doesNotMatch(workspace, /portal-access-write/);
  assert.doesNotMatch(workspace, /portal-access-route/);
  assert.doesNotMatch(workspace, /admin-client/);
  assert.doesNotMatch(workspace, /SUPABASE_SERVICE_ROLE_KEY/);
});
