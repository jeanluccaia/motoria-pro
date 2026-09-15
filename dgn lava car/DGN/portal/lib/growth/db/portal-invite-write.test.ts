import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PortalInviteError,
  prepareWhatsAppInvite,
  formatBrazilianPhoneDisplay,
} from "./portal-invite-write.ts";

// -----------------------------------------------------------------------------
// Fake do SupabaseClient replicando padrão de portal-access-write.test.ts.
// Cada .from() cria um builder novo com filtros próprios (para não vazar filtros
// entre queries sequenciais no mesmo módulo).
// -----------------------------------------------------------------------------

interface CustomerRow {
  id: string;
  legacy_id: string | null;
  name: string;
  email: string | null;
  primary_phone: string | null;
  normalized_phone: string | null;
  portal_beta_enabled: boolean;
}

interface State {
  customers: CustomerRow[];
  interactions: Array<Record<string, unknown>>;
}

function buildFake(state: State): SupabaseClient {
  const makeBuilder = <T>(rows: T[]) => {
    const filters: Array<{ column: string; value: unknown }> = [];
    let wantSingle = false;
    let wantMaybe = false;

    const run = () => {
      let filtered = rows.slice();
      for (const f of filters) filtered = filtered.filter((r) => (r as Record<string, unknown>)[f.column] === f.value);
      if (wantMaybe) return { data: (filtered[0] ?? null) as unknown, error: null };
      if (wantSingle) {
        if (filtered.length !== 1) return { data: null, error: { message: "not single", code: "PGRST116" } };
        return { data: filtered[0] as unknown, error: null };
      }
      return { data: filtered as unknown, error: null };
    };

    const chain: Record<string, unknown> = {
      select() { return chain; },
      eq(column: string, value: unknown) { filters.push({ column, value }); return chain; },
      maybeSingle() { wantMaybe = true; return Promise.resolve(run()); },
      single() { wantSingle = true; return Promise.resolve(run()); },
      then(resolve: (v: unknown) => unknown) { return Promise.resolve(run()).then(resolve); },
    };
    return chain;
  };

  const executor = <T>(rows: T[]) => ({
    select() { return makeBuilder(rows); },
  });

  const client = {
    from(table: string) {
      if (table === "crm_customers") return executor(state.customers);
      if (table === "crm_interactions") {
        return {
          insert: async (row: Record<string, unknown>) => { state.interactions.push(row); return { error: null }; },
        } as unknown as ReturnType<typeof executor>;
      }
      throw new Error(`fake: tabela ${table} n/i`);
    },
  } as unknown as SupabaseClient;

  return client;
}

function baseState(overrides: Partial<CustomerRow> = {}): State {
  return {
    customers: [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        legacy_id: "bruno-rossetti",
        name: "Bruno Rossetti",
        email: "bruno@teste.com",
        primary_phone: "(19) 99999-9999",
        normalized_phone: "5519999999999",
        portal_beta_enabled: true,
        ...overrides,
      },
    ],
    interactions: [],
  };
}

// -----------------------------------------------------------------------------
// Caminho feliz — brief casos 1, 3, 4, 9, 14
// -----------------------------------------------------------------------------

test("portal ativo + telefone + e-mail → URL correta, mensagem com /entrar e e-mail, audit whatsapp_aberto", async () => {
  const state = baseState();
  const db = buildFake(state);
  const invite = await prepareWhatsAppInvite({
    customerId: "bruno-rossetti",
    actor: "digo",
    db,
  });
  assert.ok(invite.url.startsWith("https://wa.me/5519999999999?text="));
  assert.ok(invite.message.includes("https://app.dgnclub.com/entrar"), "mensagem deve conter /entrar");
  assert.ok(invite.message.includes("bruno@teste.com"), "mensagem deve conter o e-mail");
  assert.equal(invite.destinationLast4, "9999");
  assert.equal(state.interactions.length, 1);
  const interaction = state.interactions[0]!;
  assert.equal(interaction.interaction_type, "whatsapp_aberto", "action canônica deve ser 'whatsapp_aberto', jamais 'invite.sent'");
  assert.equal(interaction.channel, "WHATSAPP");
  assert.equal(interaction.actor, "digo");
  const meta = interaction.metadata as Record<string, unknown>;
  assert.equal(meta.purpose, "PORTAL_INVITE");
  assert.equal(meta.destination_last4, "9999");
  assert.equal(meta.portal_url, "https://app.dgnclub.com/entrar");
  // Nunca deve gravar telefone completo, mensagem cheia, e-mail ou token na metadata.
  assert.ok(!("full_message" in meta) && !("phone_full" in meta) && !("token" in meta) && !("email" in meta));
});

// Brief caso 2 — normalização do telefone
test("re-normaliza telefone quando normalized_phone está vazio mas primary_phone é válido", async () => {
  const state = baseState({ normalized_phone: null, primary_phone: "(11) 98888-7777" });
  const db = buildFake(state);
  const invite = await prepareWhatsAppInvite({
    customerId: "bruno-rossetti",
    actor: "digo",
    db,
  });
  assert.equal(invite.phoneE164, "5511988887777", "normalização aplica DDI 55 e remove máscara");
});

// Brief caso 12 — client não pode substituir telefone canônico
test("client NÃO pode substituir telefone canônico via input", async () => {
  const state = baseState();
  const db = buildFake(state);
  // A interface pública NÃO aceita `phone` — o único caminho para o WA é o
  // telefone canônico do customer. Este teste documenta que o input não expõe
  // nenhum override.
  const anyInput = { customerId: "bruno-rossetti", actor: "digo", db, phone: "5511000000000" } as unknown as Parameters<typeof prepareWhatsAppInvite>[0];
  const invite = await prepareWhatsAppInvite(anyInput);
  assert.equal(invite.phoneE164, "5519999999999", "telefone deve vir do banco, não do input");
});

// Brief caso 6 — sem telefone bloqueia
test("bloqueia quando telefone está ausente (422 + code no_phone)", async () => {
  const state = baseState({ normalized_phone: null, primary_phone: null });
  const db = buildFake(state);
  await assert.rejects(
    () => prepareWhatsAppInvite({ customerId: "bruno-rossetti", actor: "digo", db }),
    (err: unknown) => err instanceof PortalInviteError && err.status === 422 && err.code === "no_phone",
  );
  assert.equal(state.interactions.length, 0, "não deve registrar interação quando bloqueia");
});

// Brief caso 7 — sem e-mail bloqueia
test("bloqueia quando e-mail está ausente (422 + code no_email)", async () => {
  const state = baseState({ email: null });
  const db = buildFake(state);
  await assert.rejects(
    () => prepareWhatsAppInvite({ customerId: "bruno-rossetti", actor: "digo", db }),
    (err: unknown) => err instanceof PortalInviteError && err.status === 422 && err.code === "no_email",
  );
  assert.equal(state.interactions.length, 0);
});

// Brief caso 8 — Portal desabilitado bloqueia
test("bloqueia quando portal_beta_enabled=false (409 + code portal_disabled)", async () => {
  const state = baseState({ portal_beta_enabled: false });
  const db = buildFake(state);
  await assert.rejects(
    () => prepareWhatsAppInvite({ customerId: "bruno-rossetti", actor: "digo", db }),
    (err: unknown) => err instanceof PortalInviteError && err.status === 409 && err.code === "portal_disabled",
  );
});

// Brief caso 10 — UUID direto resolve
test("aceita UUID direto além de slug", async () => {
  const state = baseState();
  const db = buildFake(state);
  const invite = await prepareWhatsAppInvite({
    customerId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    actor: "digo",
    db,
  });
  assert.ok(invite.url.includes("wa.me/5519999999999"));
});

// Customer inexistente → 404
test("customer inexistente → 404 (code not_found)", async () => {
  const state = baseState();
  const db = buildFake(state);
  await assert.rejects(
    () => prepareWhatsAppInvite({ customerId: "nao-existe", actor: "digo", db }),
    (err: unknown) => err instanceof PortalInviteError && err.status === 404 && err.code === "not_found",
  );
});

// Telefone canônico inválido no banco (não deve acontecer, mas defesa)
test("telefone canônico inválido no banco → 422 com code invalid_phone", async () => {
  const state = baseState({ normalized_phone: "abc", primary_phone: "abc" });
  const db = buildFake(state);
  await assert.rejects(
    () => prepareWhatsAppInvite({ customerId: "bruno-rossetti", actor: "digo", db }),
    (err: unknown) => err instanceof PortalInviteError && err.status === 422 && err.code === "invalid_phone",
  );
});

// -----------------------------------------------------------------------------
// formatBrazilianPhoneDisplay — helper puro exposto para reuso
// -----------------------------------------------------------------------------

test("formatBrazilianPhoneDisplay: celular 13 dígitos", () => {
  assert.equal(formatBrazilianPhoneDisplay("5519999999999"), "(19) 99999-9999");
});

test("formatBrazilianPhoneDisplay: fixo 12 dígitos", () => {
  assert.equal(formatBrazilianPhoneDisplay("551933334444"), "(19) 3333-4444");
});

test("formatBrazilianPhoneDisplay: null/inválido → null", () => {
  assert.equal(formatBrazilianPhoneDisplay(null), null);
  assert.equal(formatBrazilianPhoneDisplay("55"), null);
  assert.equal(formatBrazilianPhoneDisplay("14 99999 9999"), null); // sem DDI 55
});
