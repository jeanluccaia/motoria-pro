import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Acesso total dos administradores às unidades (fase 3.2A — complemento).
//
// Prova, sem depender do estado real do banco, que a RLS `units: member read`
// já concede acesso total a admins independentemente de vínculos em
// user_units — e que unidades criadas/reativadas surgem automaticamente,
// enquanto unidades arquivadas somem da UI comum (que filtra archived_at is
// null, mesmo padrão de Tarefas e Resultados).
// ============================================================================

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.beforeAll(() => {
  if (!url || !anon || !service) {
    throw new Error(
      "Faltam envs: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
});

type Actor = { userId: string; email: string; client: SupabaseClient };
type Fixture = {
  adminClient: SupabaseClient;
  orgId: string;
  seedUnitId: string;
  admins: Actor[];
  manager: Actor;
  createdUserIds: string[];
};

async function makeUser(admin: SupabaseClient, email: string): Promise<{ userId: string; password: string }> {
  const password = `Aua-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  return { userId: data.user.id, password };
}

async function impersonate(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url!, anon!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return client;
}

async function purgeTestArtifacts(admin: SupabaseClient, emailSuffix: string) {
  const { data: leaked } = await admin
    .from("users")
    .select("id")
    .ilike("email", `%${emailSuffix}`);
  const ids = (leaked ?? []).map((r) => r.id as string);
  if (ids.length === 0) return;
  await admin.from("users").delete().in("id", ids);
  for (const uid of ids) {
    await admin.auth.admin.deleteUser(uid);
  }
}

async function setupFixture(): Promise<Fixture> {
  const adminClient = createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Começa limpo: se um run anterior falhou no teardown, remove os órfãos.
  await purgeTestArtifacts(adminClient, "@units-access.test");

  const suffix = randomUUID().slice(0, 8);

  const { data: org, error: orgErr } = await adminClient
    .from("organizations")
    .insert({ name: `UnitsAccess ${suffix}`, slug: `units-access-${suffix}` })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(`org: ${orgErr?.message}`);

  const { data: seedUnit, error: seedErr } = await adminClient
    .from("units")
    .insert({ organization_id: org.id, name: "Seed Unit", slug: `seed-${suffix}` })
    .select("id")
    .single();
  if (seedErr || !seedUnit) throw new Error(`seed unit: ${seedErr?.message}`);

  // Seis admins — espelha a rede real (6 administradores). Nenhum recebe
  // vínculo em user_units, para provar que o acesso vem exclusivamente da RLS.
  const admins: Actor[] = [];
  const createdUserIds: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const email = `admin-${i}-${suffix}@units-access.test`;
    const created = await makeUser(adminClient, email);
    createdUserIds.push(created.userId);
    const { error: linkErr } = await adminClient
      .from("user_organizations")
      .insert({ user_id: created.userId, organization_id: org.id, role: "admin" });
    if (linkErr) throw new Error(`link admin ${i}: ${linkErr.message}`);
    const client = await impersonate(email, created.password);
    admins.push({ userId: created.userId, email, client });
  }

  // Um unit_manager sem nenhum vínculo — controle negativo.
  const managerEmail = `manager-${suffix}@units-access.test`;
  const managerCreated = await makeUser(adminClient, managerEmail);
  createdUserIds.push(managerCreated.userId);
  const { error: mLinkErr } = await adminClient
    .from("user_organizations")
    .insert({ user_id: managerCreated.userId, organization_id: org.id, role: "unit_manager" });
  if (mLinkErr) throw new Error(`link manager: ${mLinkErr.message}`);
  const managerClient = await impersonate(managerEmail, managerCreated.password);

  return {
    adminClient,
    orgId: org.id,
    seedUnitId: seedUnit.id,
    admins,
    manager: { userId: managerCreated.userId, email: managerEmail, client: managerClient },
    createdUserIds,
  };
}

async function teardownFixture(fixture: Fixture) {
  const { error: orgErr } = await fixture.adminClient
    .from("organizations")
    .delete()
    .eq("id", fixture.orgId);
  if (orgErr) console.warn(`[teardown] org ${fixture.orgId}: ${orgErr.message}`);
  const { error: pubErr } = await fixture.adminClient
    .from("users")
    .delete()
    .in("id", fixture.createdUserIds);
  if (pubErr) console.warn(`[teardown] public.users: ${pubErr.message}`);
  for (const uid of fixture.createdUserIds) {
    const { error } = await fixture.adminClient.auth.admin.deleteUser(uid);
    if (error) console.warn(`[teardown] auth.deleteUser ${uid}: ${error.message}`);
  }
  await purgeTestArtifacts(fixture.adminClient, "@units-access.test");
}

test.describe("Admins — acesso total às unidades", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await setupFixture();
  });

  test.afterAll(async () => {
    if (fixture) await teardownFixture(fixture);
  });

  test("nova unidade aparece automaticamente para os 6 administradores; unit_manager sem vínculo não a vê", async () => {
    // (1) admin cria uma nova unidade (via service_role — simula rota /config/unidades)
    const suffix = randomUUID().slice(0, 6);
    const { data: novaUnidade, error } = await fixture.adminClient
      .from("units")
      .insert({
        organization_id: fixture.orgId,
        name: `Nova ${suffix}`,
        slug: `nova-${suffix}`,
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(novaUnidade).not.toBeNull();

    // (2) os 6 admins enxergam a nova unidade — sem nenhum vínculo em user_units
    for (const [i, admin] of fixture.admins.entries()) {
      const { data, error: readErr } = await admin.client
        .from("units")
        .select("id")
        .eq("organization_id", fixture.orgId);
      expect(readErr, `admin ${i} deveria ler units`).toBeNull();
      const ids = (data ?? []).map((u) => u.id);
      expect(ids, `admin ${i} não viu a nova unidade`).toContain(novaUnidade!.id);
    }

    // (3) unit_manager sem vínculo não vê a nova unidade
    const { data: managerData, error: managerErr } = await fixture.manager.client
      .from("units")
      .select("id")
      .eq("organization_id", fixture.orgId);
    expect(managerErr).toBeNull();
    const managerIds = (managerData ?? []).map((u) => u.id);
    expect(managerIds).not.toContain(novaUnidade!.id);
  });

  test("unidade arquivada some da UI comum; reativada volta para os administradores", async () => {
    // Cria unidade dedicada para este teste — isolada da anterior.
    const suffix = randomUUID().slice(0, 6);
    const { data: unit, error: insErr } = await fixture.adminClient
      .from("units")
      .insert({ organization_id: fixture.orgId, name: `Arch ${suffix}`, slug: `arch-${suffix}` })
      .select("id")
      .single();
    expect(insErr).toBeNull();
    expect(unit).not.toBeNull();

    const admin = fixture.admins[0];

    // (4) arquiva a unidade — a UI usa .filter(u => !u.archived_at) (ver
    // tarefas/page.tsx e resultados/page.tsx). Reproduzimos o mesmo filtro.
    const { error: archErr } = await fixture.adminClient
      .from("units")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", unit!.id);
    expect(archErr).toBeNull();

    const readArchived = async () => {
      const { data } = await admin.client
        .from("units")
        .select("id, archived_at")
        .eq("organization_id", fixture.orgId);
      return data ?? [];
    };

    const afterArchive = await readArchived();
    const visibleAfterArchive = afterArchive.filter((u) => !u.archived_at).map((u) => u.id);
    expect(visibleAfterArchive).not.toContain(unit!.id);
    // Ainda assim, a linha existe para o admin (útil em /config/unidades).
    expect(afterArchive.map((u) => u.id)).toContain(unit!.id);

    // (5) reativa — volta a aparecer para todos os admins na UI comum.
    const { error: unarchErr } = await fixture.adminClient
      .from("units")
      .update({ archived_at: null })
      .eq("id", unit!.id);
    expect(unarchErr).toBeNull();

    for (const [i, a] of fixture.admins.entries()) {
      const { data } = await a.client
        .from("units")
        .select("id, archived_at")
        .eq("organization_id", fixture.orgId);
      const visible = (data ?? []).filter((u) => !u.archived_at).map((u) => u.id);
      expect(visible, `admin ${i} não viu unidade reativada`).toContain(unit!.id);
    }
  });
});
