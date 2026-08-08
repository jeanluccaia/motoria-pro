import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { runUtmifySync } from "../src/lib/integrations/utmify/sync";
import { createUtmifyFakeClient } from "../src/lib/integrations/utmify/fake";
import type { AdCampaignRow } from "../src/lib/integrations/utmify/types";

// ============================================================================
// Fase 3 — testes de banco/RLS para o painel de resultados.
// Foco: idempotência do sync, isolamento por organização e por unidade,
// respeito ao mapeamento manual, cálculo de "sem unidade mapeada".
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
  orgAId: string;
  orgBId: string;
  unitIpiranga: string;
  unitAmoreiras: string;
  unitOther: string; // unidade sem alias, apenas para amarrar unit_manager
  admin: Actor;
  unitManager: Actor;
  outsider: Actor;
  createdUserIds: string[];
  createdOrgIds: string[];
};

async function makeUser(admin: SupabaseClient, email: string) {
  const password = `Res-${randomUUID()}!`;
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

async function setupFixture(): Promise<Fixture> {
  const adminClient = createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = randomUUID().slice(0, 8);

  const { data: orgA, error: orgAErr } = await adminClient
    .from("organizations")
    .insert({ name: `ResOrgA ${suffix}`, slug: `res-org-a-${suffix}` })
    .select("id")
    .single();
  if (orgAErr || !orgA) throw new Error(`orgA: ${orgAErr?.message}`);

  const { data: orgB, error: orgBErr } = await adminClient
    .from("organizations")
    .insert({ name: `ResOrgB ${suffix}`, slug: `res-org-b-${suffix}` })
    .select("id")
    .single();
  if (orgBErr || !orgB) throw new Error(`orgB: ${orgBErr?.message}`);

  const { data: units, error: uErr } = await adminClient
    .from("units")
    .insert([
      { organization_id: orgA.id, name: "Ipiranga Test", slug: `res-ipiranga-${suffix}` },
      { organization_id: orgA.id, name: "Amoreiras Test", slug: `res-amoreiras-${suffix}` },
      { organization_id: orgA.id, name: "Outra Test", slug: `res-outra-${suffix}` },
    ])
    .select("id, slug");
  if (uErr || !units || units.length !== 3) throw new Error(`units: ${uErr?.message}`);
  const [uIp, uAm, uOt] = units;

  // Aliases da org de teste (não usa os aliases seed, para isolar):
  await adminClient.from("campaign_unit_aliases").insert([
    { organization_id: orgA.id, alias: "IPIRANGA", unit_id: uIp.id },
    { organization_id: orgA.id, alias: "AMOREIRAS", unit_id: uAm.id },
  ]);

  const adminEmail = `res-admin-${suffix}@tests.dev`;
  const managerEmail = `res-mgr-${suffix}@tests.dev`;
  const outsiderEmail = `res-out-${suffix}@tests.dev`;

  const adminUser = await makeUser(adminClient, adminEmail);
  const mgrUser = await makeUser(adminClient, managerEmail);
  const outsiderUser = await makeUser(adminClient, outsiderEmail);

  await adminClient.from("user_organizations").insert([
    { user_id: adminUser.userId, organization_id: orgA.id, role: "admin" },
    { user_id: mgrUser.userId, organization_id: orgA.id, role: "unit_manager" },
    { user_id: outsiderUser.userId, organization_id: orgB.id, role: "admin" },
  ]);

  await adminClient.from("user_units").insert([
    { user_id: mgrUser.userId, unit_id: uIp.id },
  ]);

  return {
    adminClient,
    orgAId: orgA.id,
    orgBId: orgB.id,
    unitIpiranga: uIp.id,
    unitAmoreiras: uAm.id,
    unitOther: uOt.id,
    admin: { userId: adminUser.userId, email: adminEmail, client: await impersonate(adminEmail, adminUser.password) },
    unitManager: { userId: mgrUser.userId, email: managerEmail, client: await impersonate(managerEmail, mgrUser.password) },
    outsider: { userId: outsiderUser.userId, email: outsiderEmail, client: await impersonate(outsiderEmail, outsiderUser.password) },
    createdUserIds: [adminUser.userId, mgrUser.userId, outsiderUser.userId],
    createdOrgIds: [orgA.id, orgB.id],
  };
}

async function teardownFixture(f: Fixture) {
  for (const uid of f.createdUserIds) await f.adminClient.auth.admin.deleteUser(uid);
  for (const oid of f.createdOrgIds) await f.adminClient.from("organizations").delete().eq("id", oid);
}

function row(name: string, spendCents = 100, extra: Partial<AdCampaignRow> = {}): AdCampaignRow {
  return {
    provider: "meta",
    externalAccountId: extra.externalAccountId ?? "acc-1",
    externalAccountName: extra.externalAccountName ?? "Conta Test",
    externalId: extra.externalId ?? `ext-${randomUUID().slice(0, 8)}`,
    name,
    status: extra.status ?? "ACTIVE",
    spendCents,
    impressions: extra.impressions ?? 1000,
    clicks: extra.clicks ?? 10,
    landingPageViews: extra.landingPageViews ?? 5,
    initiateCheckouts: extra.initiateCheckouts ?? null,
    leads: extra.leads ?? null,
    frequency: extra.frequency ?? 1.2,
  };
}

test.describe("Sync UTMify — idempotência e mapeamento", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await setupFixture();
  });
  test.afterAll(async () => {
    if (fixture) await teardownFixture(fixture);
  });

  test("primeira sincronização cria campanhas e snapshots com unidade auto", async () => {
    const day = "2026-08-05";
    const rowIp = row("LF | VENDAS | IPIRANGA | POWER PLUS | AGO26", 1000, { externalId: "ext-ip-1" });
    const rowAm = row("LF | VENDAS | AMOREIRAS | POWER PLUS | AGO26", 2000, { externalId: "ext-am-1" });
    const rowUnk = row("LF | VENDAS | ANCHIETA | AGO26", 500, { externalId: "ext-unk-1" });

    const client = createUtmifyFakeClient({
      days: { [day]: { date: day, rows: [rowIp, rowAm, rowUnk] } },
    });

    const outcome = await runUtmifySync(fixture.adminClient, client, {
      organizationId: fixture.orgAId,
      fromYmd: day,
      toYmd: day,
      triggeredBy: "manual",
    });

    expect(outcome.status).toBe("success");
    expect(outcome.rowsUpserted).toBe(3);

    const { data: campaigns } = await fixture.adminClient
      .from("campaigns")
      .select("external_id, unit_id, unit_source, name")
      .eq("organization_id", fixture.orgAId);
    expect(campaigns?.length).toBe(3);

    const ip = campaigns!.find((c) => c.external_id === "ext-ip-1")!;
    const am = campaigns!.find((c) => c.external_id === "ext-am-1")!;
    const un = campaigns!.find((c) => c.external_id === "ext-unk-1")!;
    expect(ip.unit_source).toBe("auto");
    expect(ip.unit_id).toBe(fixture.unitIpiranga);
    expect(am.unit_source).toBe("auto");
    expect(am.unit_id).toBe(fixture.unitAmoreiras);
    expect(un.unit_source).toBe("unresolved");
    expect(un.unit_id).toBeNull();
  });

  test("reexecutar mesmo período não duplica snapshots", async () => {
    const day = "2026-08-05";
    const rowIp = row("LF | VENDAS | IPIRANGA | POWER PLUS | AGO26", 1500, {
      externalId: "ext-ip-1",
    });
    const client = createUtmifyFakeClient({
      days: { [day]: { date: day, rows: [rowIp] } },
    });

    await runUtmifySync(fixture.adminClient, client, {
      organizationId: fixture.orgAId,
      fromYmd: day,
      toYmd: day,
      triggeredBy: "manual",
    });

    const { data: snapshots } = await fixture.adminClient
      .from("campaign_snapshots")
      .select("id, spend_cents")
      .eq("organization_id", fixture.orgAId)
      .eq("snapshot_date", day);
    // 3 campanhas do teste anterior, uma delas com spend atualizado.
    expect(snapshots?.length).toBe(3);
    const ipSnap = snapshots!.find((s) => s.spend_cents === 1500);
    expect(ipSnap).toBeTruthy();
  });

  test("mapeamento manual vence automático em sync subsequente", async () => {
    // Marca ext-unk-1 manualmente como Amoreiras.
    await fixture.adminClient
      .from("campaigns")
      .update({ unit_id: fixture.unitAmoreiras, unit_source: "manual" })
      .eq("organization_id", fixture.orgAId)
      .eq("external_id", "ext-unk-1");

    const day = "2026-08-06";
    // Sync novo com nome "SEM UNIDADE" — o automático diria unresolved,
    // mas o manual precisa permanecer.
    const rowUnk = row("LF | SEM UNIDADE | AGO26", 700, { externalId: "ext-unk-1" });
    const client = createUtmifyFakeClient({
      days: { [day]: { date: day, rows: [rowUnk] } },
    });

    await runUtmifySync(fixture.adminClient, client, {
      organizationId: fixture.orgAId,
      fromYmd: day,
      toYmd: day,
      triggeredBy: "manual",
    });

    const { data } = await fixture.adminClient
      .from("campaigns")
      .select("unit_id, unit_source")
      .eq("organization_id", fixture.orgAId)
      .eq("external_id", "ext-unk-1")
      .single();
    expect(data?.unit_source).toBe("manual");
    expect(data?.unit_id).toBe(fixture.unitAmoreiras);
  });

  test("falha na fonte não apaga snapshots anteriores; run vira 'error'", async () => {
    const day = "2026-08-07";
    const client = createUtmifyFakeClient({
      failOn: {
        [day]: { code: "timeout", message: "Timeout" },
      },
    });

    const outcome = await runUtmifySync(fixture.adminClient, client, {
      organizationId: fixture.orgAId,
      fromYmd: day,
      toYmd: day,
      triggeredBy: "manual",
    });
    expect(outcome.status).toBe("error");
    expect(outcome.errors.length).toBe(1);

    // Snapshots do dia anterior continuam.
    const { data: prior } = await fixture.adminClient
      .from("campaign_snapshots")
      .select("id")
      .eq("organization_id", fixture.orgAId)
      .eq("snapshot_date", "2026-08-05");
    expect((prior ?? []).length).toBe(3);
  });

  test("outra organização não vê campanhas/snapshots da orgA", async () => {
    const { data } = await fixture.outsider.client
      .from("campaigns")
      .select("id, organization_id");
    const orgs = new Set((data ?? []).map((c) => c.organization_id));
    expect(orgs.has(fixture.orgAId)).toBe(false);

    const { data: snaps } = await fixture.outsider.client
      .from("campaign_snapshots")
      .select("id, organization_id");
    const snapOrgs = new Set((snaps ?? []).map((s) => s.organization_id));
    expect(snapOrgs.has(fixture.orgAId)).toBe(false);
  });

  test("unit_manager só vê campanhas mapeadas para sua unidade", async () => {
    const { data: campaigns } = await fixture.unitManager.client
      .from("campaigns")
      .select("external_id, unit_id");
    const seen = new Set((campaigns ?? []).map((c) => c.external_id));
    // Ipiranga → unit dele; Amoreiras → outra unidade; ext-unk → manual Amoreiras.
    expect(seen.has("ext-ip-1")).toBe(true);
    expect(seen.has("ext-am-1")).toBe(false);
    expect(seen.has("ext-unk-1")).toBe(false);
  });

  test("unit_manager só vê snapshots das suas campanhas", async () => {
    const { data: snaps } = await fixture.unitManager.client
      .from("campaign_snapshots")
      .select("id, campaign_id");
    // Todos os snapshots visíveis devem pertencer a campanhas de Ipiranga.
    const { data: ipCampaigns } = await fixture.adminClient
      .from("campaigns")
      .select("id")
      .eq("organization_id", fixture.orgAId)
      .eq("unit_id", fixture.unitIpiranga);
    const ipIds = new Set((ipCampaigns ?? []).map((c) => c.id));
    for (const s of snaps ?? []) {
      expect(ipIds.has(s.campaign_id)).toBe(true);
    }
  });

  test("usuário comum não altera snapshots (write bloqueado pela ausência de policy)", async () => {
    const { data: any } = await fixture.adminClient
      .from("campaign_snapshots")
      .select("id")
      .eq("organization_id", fixture.orgAId)
      .limit(1);
    const someId = any?.[0]?.id;
    expect(someId).toBeTruthy();
    const { error, data } = await fixture.unitManager.client
      .from("campaign_snapshots")
      .update({ spend_cents: 999999 })
      .eq("id", someId!)
      .select("id");
    const blocked = !!error || !Array.isArray(data) || data.length === 0;
    expect(blocked).toBe(true);
  });

  test("sync_runs só é lido por admin", async () => {
    const { data: mgrView } = await fixture.unitManager.client
      .from("sync_runs")
      .select("id")
      .eq("organization_id", fixture.orgAId);
    expect((mgrView ?? []).length).toBe(0);

    const { data: adminView } = await fixture.admin.client
      .from("sync_runs")
      .select("id")
      .eq("organization_id", fixture.orgAId);
    expect((adminView ?? []).length).toBeGreaterThan(0);
  });
});
