import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Testes negativos de RLS — Fase 1 do Loud Flow
//
// Verificam que:
//   (a) unit_manager só enxerga as unidades vinculadas em user_units.
//   (b) qualquer papel que não seja admin não lê audit_log.
//   (c) qualquer papel que não seja admin não escreve em user_organizations.
//
// Como funciona:
//   - Um cliente "admin" (service_role) prepara fixtures: cria users, org,
//     units, vinculações. RLS é ignorada com service_role.
//   - Para cada teste, criamos um cliente "impersonated" (anon key) com o
//     JWT do usuário-alvo. Todas as consultas passam por RLS.
//   - Ao final, o cliente admin remove os usuários criados via
//     `auth.admin.deleteUser`. As linhas em public.users e cascatas caem por
//     ON DELETE CASCADE.
// ============================================================================

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.beforeAll(() => {
  if (!url || !anon || !service) {
    throw new Error(
      "Faltam envs: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Preencha .env.local ou .env.test.local antes de rodar.",
    );
  }
});

type Fixture = {
  adminClient: SupabaseClient;
  orgId: string;
  unitAId: string;
  unitBId: string;
  managerAUserId: string;
  managerAClient: SupabaseClient;
  marketingUserId: string;
  marketingClient: SupabaseClient;
  createdUserIds: string[];
};

async function makeUser(admin: SupabaseClient, email: string) {
  const password = `Rls-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser falhou para ${email}: ${error?.message}`);
  }
  return { userId: data.user.id, password };
}

async function impersonate(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url!, anon!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn falhou para ${email}: ${error.message}`);
  return client;
}

async function setupFixture(): Promise<Fixture> {
  const adminClient = createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = randomUUID().slice(0, 8);
  const orgName = `RLS Test ${suffix}`;
  const orgSlug = `rls-test-${suffix}`;

  const { data: org, error: orgErr } = await adminClient
    .from("organizations")
    .insert({ name: orgName, slug: orgSlug })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(`insert org falhou: ${orgErr?.message}`);

  const { data: units, error: unitsErr } = await adminClient
    .from("units")
    .insert([
      { organization_id: org.id, name: "Unit A", slug: `unit-a-${suffix}` },
      { organization_id: org.id, name: "Unit B", slug: `unit-b-${suffix}` },
    ])
    .select("id, slug");
  if (unitsErr || !units || units.length !== 2) {
    throw new Error(`insert units falhou: ${unitsErr?.message}`);
  }
  const unitA = units.find((u) => u.slug === `unit-a-${suffix}`)!;
  const unitB = units.find((u) => u.slug === `unit-b-${suffix}`)!;

  const managerEmail = `manager-a-${suffix}@rls.test`;
  const marketingEmail = `marketing-${suffix}@rls.test`;

  const manager = await makeUser(adminClient, managerEmail);
  const marketing = await makeUser(adminClient, marketingEmail);

  const { error: mLinkErr } = await adminClient.from("user_organizations").insert([
    { user_id: manager.userId, organization_id: org.id, role: "unit_manager" },
    { user_id: marketing.userId, organization_id: org.id, role: "marketing" },
  ]);
  if (mLinkErr) throw new Error(`link user_organizations: ${mLinkErr.message}`);

  const { error: mUnitErr } = await adminClient
    .from("user_units")
    .insert({ user_id: manager.userId, unit_id: unitA.id });
  if (mUnitErr) throw new Error(`link user_units: ${mUnitErr.message}`);

  const managerAClient = await impersonate(managerEmail, manager.password);
  const marketingClient = await impersonate(marketingEmail, marketing.password);

  return {
    adminClient,
    orgId: org.id,
    unitAId: unitA.id,
    unitBId: unitB.id,
    managerAUserId: manager.userId,
    managerAClient,
    marketingUserId: marketing.userId,
    marketingClient,
    createdUserIds: [manager.userId, marketing.userId],
  };
}

async function teardownFixture(fixture: Fixture) {
  for (const uid of fixture.createdUserIds) {
    await fixture.adminClient.auth.admin.deleteUser(uid);
  }
  await fixture.adminClient
    .from("organizations")
    .delete()
    .eq("id", fixture.orgId);
}

test.describe("RLS negativos — Fase 1", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await setupFixture();
  });

  test.afterAll(async () => {
    if (fixture) await teardownFixture(fixture);
  });

  test("(a) unit_manager não vê unidades fora do seu user_units", async () => {
    const { data, error } = await fixture.managerAClient
      .from("units")
      .select("id")
      .eq("organization_id", fixture.orgId);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    const ids = (data ?? []).map((u) => u.id);
    expect(ids).toContain(fixture.unitAId);
    expect(ids).not.toContain(fixture.unitBId);
  });

  test("(b) não-admin não lê audit_log", async () => {
    await fixture.adminClient.from("audit_log").insert({
      organization_id: fixture.orgId,
      action: "test.seed",
      target_type: "system",
    });

    const { data, error } = await fixture.marketingClient
      .from("audit_log")
      .select("id")
      .eq("organization_id", fixture.orgId);

    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  test("(c) não-admin não escreve em user_organizations", async () => {
    const targetEmail = `victim-${randomUUID().slice(0, 8)}@rls.test`;
    const victim = await makeUser(fixture.adminClient, targetEmail);
    fixture.createdUserIds.push(victim.userId);

    const { error, data } = await fixture.marketingClient
      .from("user_organizations")
      .insert({
        user_id: victim.userId,
        organization_id: fixture.orgId,
        role: "admin",
      })
      .select();

    const rowInserted = Array.isArray(data) && data.length > 0;
    const rlsBlocked = !!error || !rowInserted;
    expect(rlsBlocked).toBe(true);

    const { data: check } = await fixture.adminClient
      .from("user_organizations")
      .select("role")
      .eq("user_id", victim.userId)
      .eq("organization_id", fixture.orgId);
    expect(check ?? []).toEqual([]);
  });
});
