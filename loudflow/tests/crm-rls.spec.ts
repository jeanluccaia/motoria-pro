import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Testes de RLS do CRM de Leads de Franquia (migration 0017).
//
// Pré-requisito: migration 0017_crm_franchise_leads.sql APLICADA no projeto
// de teste. Enquanto 0017 não estiver em produção, estes testes falham com
// erro 42P01 (relation does not exist) — comportamento esperado, não um bug.
//
// Padrão herdado de tests/rls.spec.ts: fixture via service_role, clientes
// impersonados via anon + signInWithPassword. Service_role é usado APENAS
// para setup/teardown; todas as asserções passam pelo pipeline normal
// (RLS + triggers + FKs).
//
// Cobertura:
//   admin                                                              — CRUD completo + delete.
//   marketing                                                          — create/update sim; delete não.
//   partner (visualiza / registra contato / atualiza campos operacionais)
//           — não cria, não edita cadastro, não exclui, não muda organization_id.
//   unit_manager                                                       — sem acesso.
//   cross-org                                                          — leak de leitura e de escrita bloqueado.
//   histórico imutável para marketing e partner                        — sem UPDATE/DELETE.
//   duplicidade por phone_normalized dentro da mesma org               — bloqueada.
//   telefone incompleto (phone_normalized=null)                        — permitido, dedupe não dispara.
//   lost sem lost_reason                                               — bloqueado por check constraint.
//   integridade (lead_id, organization_id) cross-org via FK composta   — bloqueada mesmo com service_role.
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

type OrgUsers = {
  admin: { userId: string; client: SupabaseClient };
  marketing: { userId: string; client: SupabaseClient };
  partner: { userId: string; client: SupabaseClient };
  manager: { userId: string; client: SupabaseClient };
};

type Fixture = {
  svc: SupabaseClient;
  orgA: { id: string; users: OrgUsers; seedLeadId: string };
  orgB: { id: string; users: Pick<OrgUsers, "admin">; seedLeadId: string };
  createdUserIds: string[];
};

async function makeUser(svc: SupabaseClient, email: string) {
  const password = `Crm-${randomUUID()}!`;
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser falhou para ${email}: ${error?.message}`);
  }
  return { userId: data.user.id, email, password };
}

async function impersonate(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url!, anon!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn falhou para ${email}: ${error.message}`);
  return client;
}

async function createOrgWithRoles(svc: SupabaseClient, suffix: string, label: string) {
  const { data: org, error: orgErr } = await svc
    .from("organizations")
    .insert({ name: `CRM Test ${label} ${suffix}`, slug: `crm-test-${label}-${suffix}` })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(`insert org ${label}: ${orgErr?.message}`);

  const adminU = await makeUser(svc, `admin-${label}-${suffix}@crm.test`);
  const marketingU = await makeUser(svc, `marketing-${label}-${suffix}@crm.test`);
  const partnerU = await makeUser(svc, `partner-${label}-${suffix}@crm.test`);
  const managerU = await makeUser(svc, `manager-${label}-${suffix}@crm.test`);

  const { error: linkErr } = await svc.from("user_organizations").insert([
    { user_id: adminU.userId, organization_id: org.id, role: "admin" },
    { user_id: marketingU.userId, organization_id: org.id, role: "marketing" },
    { user_id: partnerU.userId, organization_id: org.id, role: "partner" },
    { user_id: managerU.userId, organization_id: org.id, role: "unit_manager" },
  ]);
  if (linkErr) throw new Error(`link user_organizations ${label}: ${linkErr.message}`);

  const users: OrgUsers = {
    admin: { userId: adminU.userId, client: await impersonate(adminU.email, adminU.password) },
    marketing: { userId: marketingU.userId, client: await impersonate(marketingU.email, marketingU.password) },
    partner: { userId: partnerU.userId, client: await impersonate(partnerU.email, partnerU.password) },
    manager: { userId: managerU.userId, client: await impersonate(managerU.email, managerU.password) },
  };

  return {
    org,
    users,
    createdIds: [adminU.userId, marketingU.userId, partnerU.userId, managerU.userId],
  };
}

async function setupFixture(): Promise<Fixture> {
  const svc = createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suffix = randomUUID().slice(0, 8);

  const a = await createOrgWithRoles(svc, suffix, "a");
  const b = await createOrgWithRoles(svc, `${suffix}-b`, "b");

  // Lead semente de cada org (criado pelo service_role; a RLS não entra aqui).
  const { data: leadA, error: leadAErr } = await svc
    .from("franchise_leads")
    .insert({
      organization_id: a.org.id,
      full_name: `Seed Lead A ${suffix}`,
      phone: "(19) 9 1234-0001",
      phone_normalized: `+5519912340${suffix.slice(0, 3)}`,
      pipeline_stage: "new",
      priority: "normal",
    })
    .select("id")
    .single();
  if (leadAErr || !leadA) throw new Error(`seed leadA: ${leadAErr?.message}`);

  const { data: leadB, error: leadBErr } = await svc
    .from("franchise_leads")
    .insert({
      organization_id: b.org.id,
      full_name: `Seed Lead B ${suffix}`,
      phone: "(11) 9 1234-0002",
      phone_normalized: `+5511912340${suffix.slice(0, 3)}`,
      pipeline_stage: "new",
      priority: "normal",
    })
    .select("id")
    .single();
  if (leadBErr || !leadB) throw new Error(`seed leadB: ${leadBErr?.message}`);

  return {
    svc,
    orgA: { id: a.org.id, users: a.users, seedLeadId: leadA.id },
    orgB: { id: b.org.id, users: { admin: b.users.admin }, seedLeadId: leadB.id },
    createdUserIds: [...a.createdIds, ...b.createdIds],
  };
}

async function teardownFixture(fx: Fixture) {
  for (const uid of fx.createdUserIds) {
    await fx.svc.auth.admin.deleteUser(uid);
  }
  // ON DELETE CASCADE em organizations limpa leads e activities.
  await fx.svc.from("organizations").delete().in("id", [fx.orgA.id, fx.orgB.id]);
}

// Helper: cria lead "fresco" em orgA via service_role e devolve o id.
async function freshLead(fx: Fixture, overrides: Record<string, unknown> = {}): Promise<string> {
  const token = randomUUID().slice(0, 10);
  const { data, error } = await fx.svc
    .from("franchise_leads")
    .insert({
      organization_id: fx.orgA.id,
      full_name: `Lead ${token}`,
      phone: `(19) 9 9999-${token.slice(0, 4)}`,
      phone_normalized: `+5519999${token.slice(0, 7)}`,
      pipeline_stage: "new",
      priority: "normal",
      ...overrides,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`freshLead: ${error?.message}`);
  return data.id;
}

test.describe("CRM Franchise Leads — RLS", () => {
  let fx: Fixture;

  test.beforeAll(async () => {
    fx = await setupFixture();
  });

  test.afterAll(async () => {
    if (fx) await teardownFixture(fx);
  });

  // -----------------------------------------------------------------------------
  // admin: acesso total
  // -----------------------------------------------------------------------------
  test("admin cria, edita, lê e deleta leads da sua org", async () => {
    const { admin } = fx.orgA.users;

    const { data: created, error: cErr } = await admin.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgA.id,
        full_name: "Admin Created",
        phone: "+5519911111111",
        phone_normalized: "+5519911111111",
        pipeline_stage: "qualified",
        priority: "high",
      })
      .select("id")
      .single();
    expect(cErr).toBeNull();
    expect(created?.id).toBeTruthy();

    const { error: uErr } = await admin.client
      .from("franchise_leads")
      .update({ full_name: "Admin Edited", pipeline_stage: "meeting_scheduled" })
      .eq("id", created!.id);
    expect(uErr).toBeNull();

    const { data: read, error: rErr } = await admin.client
      .from("franchise_leads")
      .select("id, full_name, pipeline_stage")
      .eq("id", created!.id)
      .single();
    expect(rErr).toBeNull();
    expect(read?.full_name).toBe("Admin Edited");

    const { error: dErr, count } = await admin.client
      .from("franchise_leads")
      .delete({ count: "exact" })
      .eq("id", created!.id);
    expect(dErr).toBeNull();
    expect(count).toBe(1);
  });

  // -----------------------------------------------------------------------------
  // marketing: cria/edita; não deleta
  // -----------------------------------------------------------------------------
  test("marketing cria e edita leads, mas não deleta", async () => {
    const { marketing } = fx.orgA.users;

    const { data: created, error: cErr } = await marketing.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgA.id,
        full_name: "Marketing Created",
        phone: "+5519922222222",
        phone_normalized: "+5519922222222",
        pipeline_stage: "contact_attempt",
        priority: "normal",
      })
      .select("id")
      .single();
    expect(cErr).toBeNull();
    expect(created?.id).toBeTruthy();

    const { error: uErr } = await marketing.client
      .from("franchise_leads")
      .update({ full_name: "Marketing Edited", notes: "nota" })
      .eq("id", created!.id);
    expect(uErr).toBeNull();

    // Delete deve retornar 0 linhas (RLS esconde ao invés de erro).
    const { data: deleted, error: dErr } = await marketing.client
      .from("franchise_leads")
      .delete()
      .eq("id", created!.id)
      .select("id");
    expect(dErr).toBeNull();
    expect(deleted?.length ?? 0).toBe(0);

    // Confirma via service_role que o lead continua lá.
    const { data: still } = await fx.svc
      .from("franchise_leads")
      .select("id")
      .eq("id", created!.id)
      .maybeSingle();
    expect(still?.id).toBe(created!.id);
  });

  // -----------------------------------------------------------------------------
  // partner: lê, registra contato e atualiza campos operacionais;
  // não cria, não deleta, não altera cadastro, não troca organization_id.
  // -----------------------------------------------------------------------------
  test("partner lê leads da própria org", async () => {
    const { partner } = fx.orgA.users;
    const { data, error } = await partner.client
      .from("franchise_leads")
      .select("id")
      .eq("organization_id", fx.orgA.id);
    expect(error).toBeNull();
    // Pelo menos o seedLeadId precisa estar visível.
    expect((data ?? []).some((r) => r.id === fx.orgA.seedLeadId)).toBe(true);
  });

  test("partner não cria lead", async () => {
    const { partner } = fx.orgA.users;
    const { data, error } = await partner.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgA.id,
        full_name: "Partner Should Not Create",
        phone: "+5519933333333",
        phone_normalized: "+5519933333333",
      })
      .select("id");
    // Pode voltar erro de policy OU zero linhas inseridas; ambos são bloqueio.
    const inserted = data?.length ?? 0;
    expect(Boolean(error) || inserted === 0).toBe(true);
  });

  test("partner atualiza campos operacionais mas é bloqueado em dados administrativos", async () => {
    const leadId = await freshLead(fx);
    const { partner } = fx.orgA.users;

    // Operacional permitido pelo trigger.
    const { error: okErr } = await partner.client
      .from("franchise_leads")
      .update({
        pipeline_stage: "in_conversation",
        priority: "high",
        next_action: "Reenviar mensagem",
        last_contact_at: new Date().toISOString(),
        notes: "visualizou e não respondeu",
      })
      .eq("id", leadId);
    expect(okErr).toBeNull();

    // full_name deve falhar pelo trigger.
    const { error: nameErr } = await partner.client
      .from("franchise_leads")
      .update({ full_name: "Partner tentou renomear" })
      .eq("id", leadId);
    expect(nameErr).not.toBeNull();

    // email também é administrativo.
    const { error: emailErr } = await partner.client
      .from("franchise_leads")
      .update({ email: "novo@teste.com" })
      .eq("id", leadId);
    expect(emailErr).not.toBeNull();

    // organization_id jamais pode mudar — nem via UPDATE.
    const { error: orgErr } = await partner.client
      .from("franchise_leads")
      .update({ organization_id: fx.orgB.id })
      .eq("id", leadId);
    expect(orgErr).not.toBeNull();

    // Garante que nada do que falhou ficou persistido.
    const { data: snapshot } = await fx.svc
      .from("franchise_leads")
      .select("full_name, email, organization_id")
      .eq("id", leadId)
      .single();
    expect(snapshot?.full_name).not.toBe("Partner tentou renomear");
    expect(snapshot?.email).not.toBe("novo@teste.com");
    expect(snapshot?.organization_id).toBe(fx.orgA.id);
  });

  test("partner não deleta lead", async () => {
    const leadId = await freshLead(fx);
    const { partner } = fx.orgA.users;

    const { data, error } = await partner.client
      .from("franchise_leads")
      .delete()
      .eq("id", leadId)
      .select("id");
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBe(0);

    const { data: still } = await fx.svc
      .from("franchise_leads")
      .select("id")
      .eq("id", leadId)
      .maybeSingle();
    expect(still?.id).toBe(leadId);
  });

  test("partner registra atividade de contato no lead", async () => {
    const leadId = await freshLead(fx);
    const { partner } = fx.orgA.users;

    const { data, error } = await partner.client
      .from("franchise_lead_activities")
      .insert({
        organization_id: fx.orgA.id,
        lead_id: leadId,
        activity_type: "contact",
        summary: "Partner conversou no WhatsApp.",
        occurred_at: new Date().toISOString(),
        created_by: partner.userId,
      })
      .select("id");
    expect(error).toBeNull();
    expect(data?.[0]?.id).toBeTruthy();
  });

  // -----------------------------------------------------------------------------
  // unit_manager: sem qualquer acesso
  // -----------------------------------------------------------------------------
  test("unit_manager não enxerga leads nem atividades", async () => {
    const { manager } = fx.orgA.users;

    const { data: leads, error: leadsErr } = await manager.client
      .from("franchise_leads")
      .select("id");
    expect(leadsErr).toBeNull();
    expect(leads?.length ?? 0).toBe(0);

    const { data: acts, error: actsErr } = await manager.client
      .from("franchise_lead_activities")
      .select("id");
    expect(actsErr).toBeNull();
    expect(acts?.length ?? 0).toBe(0);
  });

  test("unit_manager não escreve em franchise_leads", async () => {
    const { manager } = fx.orgA.users;
    const { data, error } = await manager.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgA.id,
        full_name: "Manager tentou criar",
        phone: "+5519944444444",
        phone_normalized: "+5519944444444",
      })
      .select("id");
    expect(Boolean(error) || (data?.length ?? 0) === 0).toBe(true);
  });

  // -----------------------------------------------------------------------------
  // cross-org: ninguém da orgA toca em dados da orgB
  // -----------------------------------------------------------------------------
  test("admin da orgA não lê leads da orgB", async () => {
    const { admin } = fx.orgA.users;
    const { data, error } = await admin.client
      .from("franchise_leads")
      .select("id")
      .eq("id", fx.orgB.seedLeadId);
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBe(0);
  });

  test("admin da orgA não altera leads da orgB", async () => {
    const { admin } = fx.orgA.users;
    const { data } = await admin.client
      .from("franchise_leads")
      .update({ full_name: "Hacked" })
      .eq("id", fx.orgB.seedLeadId)
      .select("id");
    expect(data?.length ?? 0).toBe(0);

    const { data: still } = await fx.svc
      .from("franchise_leads")
      .select("full_name")
      .eq("id", fx.orgB.seedLeadId)
      .single();
    expect(still?.full_name).not.toBe("Hacked");
  });

  test("marketing da orgA não cria lead marcando organization_id da orgB", async () => {
    const { marketing } = fx.orgA.users;
    const { data, error } = await marketing.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgB.id,
        full_name: "Tentativa cross-org",
        phone: "+5519955555555",
        phone_normalized: "+5519955555555",
      })
      .select("id");
    expect(Boolean(error) || (data?.length ?? 0) === 0).toBe(true);
  });

  // -----------------------------------------------------------------------------
  // Histórico imutável para marketing e partner
  // -----------------------------------------------------------------------------
  test("marketing não altera nem deleta atividade registrada", async () => {
    const leadId = await freshLead(fx);
    // Service_role insere a atividade (como se tivesse sido criada antes).
    const { data: act, error: iErr } = await fx.svc
      .from("franchise_lead_activities")
      .insert({
        organization_id: fx.orgA.id,
        lead_id: leadId,
        activity_type: "contact",
        summary: "registro original",
        occurred_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    expect(iErr).toBeNull();

    const { marketing } = fx.orgA.users;

    const { data: upd } = await marketing.client
      .from("franchise_lead_activities")
      .update({ summary: "editado por marketing" })
      .eq("id", act!.id)
      .select("id");
    expect(upd?.length ?? 0).toBe(0);

    const { data: del } = await marketing.client
      .from("franchise_lead_activities")
      .delete()
      .eq("id", act!.id)
      .select("id");
    expect(del?.length ?? 0).toBe(0);

    const { data: still } = await fx.svc
      .from("franchise_lead_activities")
      .select("summary")
      .eq("id", act!.id)
      .single();
    expect(still?.summary).toBe("registro original");
  });

  test("partner não altera nem deleta atividade registrada", async () => {
    const leadId = await freshLead(fx);
    const { data: act } = await fx.svc
      .from("franchise_lead_activities")
      .insert({
        organization_id: fx.orgA.id,
        lead_id: leadId,
        activity_type: "contact",
        summary: "registro original partner",
        occurred_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const { partner } = fx.orgA.users;

    const { data: upd } = await partner.client
      .from("franchise_lead_activities")
      .update({ summary: "editado por partner" })
      .eq("id", act!.id)
      .select("id");
    expect(upd?.length ?? 0).toBe(0);

    const { data: del } = await partner.client
      .from("franchise_lead_activities")
      .delete()
      .eq("id", act!.id)
      .select("id");
    expect(del?.length ?? 0).toBe(0);
  });

  // -----------------------------------------------------------------------------
  // Duplicidade / telefone / lost
  // -----------------------------------------------------------------------------
  test("não permite dois leads com mesmo phone_normalized na mesma org", async () => {
    const sharedPhone = `+55199${randomUUID().slice(0, 8)}`;
    const { admin } = fx.orgA.users;

    const first = await admin.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgA.id,
        full_name: "Dup A",
        phone: sharedPhone,
        phone_normalized: sharedPhone,
      })
      .select("id");
    expect(first.error).toBeNull();

    const second = await admin.client
      .from("franchise_leads")
      .insert({
        organization_id: fx.orgA.id,
        full_name: "Dup B",
        phone: sharedPhone,
        phone_normalized: sharedPhone,
      })
      .select("id");
    expect(second.error).not.toBeNull();
    expect(second.error?.code).toBe("23505");
  });

  test("o mesmo phone_normalized é aceito em organizações diferentes", async () => {
    const sharedPhone = `+55199${randomUUID().slice(0, 8)}`;

    const inA = await fx.svc.from("franchise_leads").insert({
      organization_id: fx.orgA.id,
      full_name: "Mesmo tel org A",
      phone: sharedPhone,
      phone_normalized: sharedPhone,
    }).select("id");
    expect(inA.error).toBeNull();

    const inB = await fx.svc.from("franchise_leads").insert({
      organization_id: fx.orgB.id,
      full_name: "Mesmo tel org B",
      phone: sharedPhone,
      phone_normalized: sharedPhone,
    }).select("id");
    expect(inB.error).toBeNull();
  });

  test("vários leads com phone_normalized = null são aceitos (telefone incompleto)", async () => {
    const { admin } = fx.orgA.users;

    const a = await admin.client.from("franchise_leads").insert({
      organization_id: fx.orgA.id,
      full_name: "Incompleto 1",
      phone: "(83) 9648-8258",
      phone_normalized: null,
    }).select("id");
    expect(a.error).toBeNull();

    const b = await admin.client.from("franchise_leads").insert({
      organization_id: fx.orgA.id,
      full_name: "Incompleto 2",
      phone: "(83) 9777-7777",
      phone_normalized: null,
    }).select("id");
    expect(b.error).toBeNull();
  });

  test("lead marcado como lost sem lost_reason é bloqueado", async () => {
    const { admin } = fx.orgA.users;
    const { error } = await admin.client.from("franchise_leads").insert({
      organization_id: fx.orgA.id,
      full_name: "Lost sem motivo",
      phone: "+5519966666666",
      phone_normalized: "+5519966666666",
      pipeline_stage: "lost",
      // lost_reason intencionalmente omitido
    });
    expect(error).not.toBeNull();
    // Postgres devolve 23514 para check constraint violation.
    expect(error?.code).toBe("23514");
  });

  test("lead marcado como lost com lost_reason é aceito", async () => {
    const { admin } = fx.orgA.users;
    const { data, error } = await admin.client.from("franchise_leads").insert({
      organization_id: fx.orgA.id,
      full_name: "Lost com motivo",
      phone: "+5519977777777",
      phone_normalized: "+5519977777777",
      pipeline_stage: "lost",
      lost_reason: "Concorrente",
    }).select("id");
    expect(error).toBeNull();
    expect(data?.[0]?.id).toBeTruthy();
  });

  // -----------------------------------------------------------------------------
  // FK composta: lead_id + organization_id precisam casar — vale até para service_role.
  // -----------------------------------------------------------------------------
  test("não permite activity cujo (lead_id, organization_id) cruza orgs — nem via service_role", async () => {
    const { error } = await fx.svc
      .from("franchise_lead_activities")
      .insert({
        organization_id: fx.orgB.id, // orgB
        lead_id: fx.orgA.seedLeadId, // mas lead é da orgA
        activity_type: "contact",
        summary: "tentativa cross-org",
        occurred_at: new Date().toISOString(),
      });
    expect(error).not.toBeNull();
    // 23503 = foreign_key_violation
    expect(error?.code).toBe("23503");
  });

  test("UPDATE que tenta trocar organization_id da activity falha pelo FK composto", async () => {
    const leadId = await freshLead(fx);
    const { data: act } = await fx.svc
      .from("franchise_lead_activities")
      .insert({
        organization_id: fx.orgA.id,
        lead_id: leadId,
        activity_type: "contact",
        summary: "antes do update cross-org",
        occurred_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const { error } = await fx.svc
      .from("franchise_lead_activities")
      .update({ organization_id: fx.orgB.id })
      .eq("id", act!.id);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23503");
  });
});
