import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Fase 2 — RLS e regras de negócio da tabela public.tasks.
//
// Fixture cria organização + admin + usuário comum + usuário de outra
// organização, todos com senha, e deriva clientes autenticados a partir do
// service_role. Ao final remove tudo via auth.admin.deleteUser + delete da
// organização (cascatas cuidam do resto).
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

type Actor = { userId: string; email: string; password: string; client: SupabaseClient };
type Fixture = {
  adminClient: SupabaseClient;
  orgAId: string;
  unitAId: string;
  orgBId: string;
  admin: Actor;
  adminB: Actor; // segundo admin da orgA — para provar colaboração multiusuário
  member: Actor;
  outsider: Actor;
  createdUserIds: string[];
  createdOrgIds: string[];
};

async function makeUser(admin: SupabaseClient, email: string): Promise<{ userId: string; password: string }> {
  const password = `Tsk-${randomUUID()}!`;
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
    .insert({ name: `TaskOrgA ${suffix}`, slug: `task-org-a-${suffix}` })
    .select("id")
    .single();
  if (orgAErr || !orgA) throw new Error(`orgA: ${orgAErr?.message}`);

  const { data: orgB, error: orgBErr } = await adminClient
    .from("organizations")
    .insert({ name: `TaskOrgB ${suffix}`, slug: `task-org-b-${suffix}` })
    .select("id")
    .single();
  if (orgBErr || !orgB) throw new Error(`orgB: ${orgBErr?.message}`);

  const { data: unit, error: unitErr } = await adminClient
    .from("units")
    .insert({ organization_id: orgA.id, name: "Unit A", slug: `unit-a-${suffix}` })
    .select("id")
    .single();
  if (unitErr || !unit) throw new Error(`unit: ${unitErr?.message}`);

  const adminEmail = `admin-${suffix}@tasks.test`;
  const adminBEmail = `admin-b-${suffix}@tasks.test`;
  const memberEmail = `member-${suffix}@tasks.test`;
  const outsiderEmail = `outsider-${suffix}@tasks.test`;

  const adminUser = await makeUser(adminClient, adminEmail);
  const adminBUser = await makeUser(adminClient, adminBEmail);
  const memberUser = await makeUser(adminClient, memberEmail);
  const outsiderUser = await makeUser(adminClient, outsiderEmail);

  const { error: linkErr } = await adminClient.from("user_organizations").insert([
    { user_id: adminUser.userId, organization_id: orgA.id, role: "admin" },
    { user_id: adminBUser.userId, organization_id: orgA.id, role: "admin" },
    { user_id: memberUser.userId, organization_id: orgA.id, role: "marketing" },
    { user_id: outsiderUser.userId, organization_id: orgB.id, role: "admin" },
  ]);
  if (linkErr) throw new Error(`link: ${linkErr.message}`);

  const adminAuth = await impersonate(adminEmail, adminUser.password);
  const adminBAuth = await impersonate(adminBEmail, adminBUser.password);
  const memberAuth = await impersonate(memberEmail, memberUser.password);
  const outsiderAuth = await impersonate(outsiderEmail, outsiderUser.password);

  return {
    adminClient,
    orgAId: orgA.id,
    unitAId: unit.id,
    orgBId: orgB.id,
    admin: { userId: adminUser.userId, email: adminEmail, password: adminUser.password, client: adminAuth },
    adminB: { userId: adminBUser.userId, email: adminBEmail, password: adminBUser.password, client: adminBAuth },
    member: { userId: memberUser.userId, email: memberEmail, password: memberUser.password, client: memberAuth },
    outsider: {
      userId: outsiderUser.userId,
      email: outsiderEmail,
      password: outsiderUser.password,
      client: outsiderAuth,
    },
    createdUserIds: [adminUser.userId, adminBUser.userId, memberUser.userId, outsiderUser.userId],
    createdOrgIds: [orgA.id, orgB.id],
  };
}

// Teardown ordenado: (1) apagar orgs para cascadear vínculos, (2) apagar
// linhas em public.users explicitamente — não existe FK/cascade a partir
// de auth.users, então deleteUser sozinho deixa órfãos; (3) apagar em
// auth.users. Erros são registrados mas não interrompem o cleanup dos
// próximos itens — garantimos que o próximo run comece limpo.
async function teardownFixture(fixture: Fixture) {
  for (const oid of fixture.createdOrgIds) {
    const { error } = await fixture.adminClient
      .from("organizations")
      .delete()
      .eq("id", oid);
    if (error) console.warn(`[teardown] org ${oid}: ${error.message}`);
  }
  const { error: pubErr } = await fixture.adminClient
    .from("users")
    .delete()
    .in("id", fixture.createdUserIds);
  if (pubErr) console.warn(`[teardown] public.users: ${pubErr.message}`);
  for (const uid of fixture.createdUserIds) {
    const { error } = await fixture.adminClient.auth.admin.deleteUser(uid);
    if (error) console.warn(`[teardown] auth.deleteUser ${uid}: ${error.message}`);
  }
  // Safety-net: independente do que passou acima, remove qualquer resíduo
  // com o padrão de email de teste desta suíte. Idempotente.
  await purgeTestArtifacts(fixture.adminClient, "@tasks.test");
}

// Remove qualquer usuário órfão criado por execuções anteriores do teste
// (identificado por padrão de email). Deve ser chamado no beforeAll para
// começar a suíte com estado limpo e no fim como safety-net.
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

async function insertTaskAsAdmin(
  fixture: Fixture,
  overrides: Partial<{
    title: string;
    assigned_to: string;
    unit_id: string | null;
    due_at: string | null;
    priority: "low" | "normal" | "high";
    organization_id: string;
  }> = {},
): Promise<{ id: string }> {
  const { data, error } = await fixture.adminClient
    .from("tasks")
    .insert({
      organization_id: overrides.organization_id ?? fixture.orgAId,
      unit_id: overrides.unit_id === undefined ? fixture.unitAId : overrides.unit_id,
      title: overrides.title ?? "T " + randomUUID().slice(0, 6),
      assigned_to: overrides.assigned_to ?? fixture.member.userId,
      created_by: fixture.admin.userId,
      priority: overrides.priority ?? "normal",
      due_at: overrides.due_at ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`insert task: ${error?.message}`);
  return data;
}

test.describe("Tasks — RLS + regras de negócio", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    // Começa limpo: se runs anteriores deixaram lixo com nosso padrão de
    // email, remove antes de criar novos.
    const admin = createClient(url!, service!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await purgeTestArtifacts(admin, "@tasks.test");
    fixture = await setupFixture();
  });

  test.afterAll(async () => {
    if (fixture) await teardownFixture(fixture);
  });

  test("admin cria tarefa e usuário atribuído a enxerga; terceiro não", async () => {
    // Admin cria via seu próprio client (RLS aprova via "tasks: admin all")
    const { data: created, error } = await fixture.admin.client
      .from("tasks")
      .insert({
        organization_id: fixture.orgAId,
        unit_id: fixture.unitAId,
        title: "Ligar para cliente",
        assigned_to: fixture.member.userId,
        created_by: fixture.admin.userId,
        priority: "high",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(created?.id).toBeTruthy();

    // Usuário atribuído lê
    const { data: mine } = await fixture.member.client
      .from("tasks")
      .select("id")
      .eq("id", created!.id);
    expect((mine ?? []).length).toBe(1);

    // Terceiro (outra org) não vê
    const { data: none } = await fixture.outsider.client
      .from("tasks")
      .select("id")
      .eq("id", created!.id);
    expect((none ?? []).length).toBe(0);
  });

  test("usuário comum não cria tarefa", async () => {
    const { error, data } = await fixture.member.client
      .from("tasks")
      .insert({
        organization_id: fixture.orgAId,
        title: "Não posso",
        assigned_to: fixture.member.userId,
        created_by: fixture.member.userId,
      })
      .select("id");
    const blocked = !!error || !Array.isArray(data) || data.length === 0;
    expect(blocked).toBe(true);
  });

  test("usuário comum não altera campos administrativos", async () => {
    const t = await insertTaskAsAdmin(fixture, { title: "Original" });
    const { error, data } = await fixture.member.client
      .from("tasks")
      .update({ title: "hackeado", priority: "high" })
      .eq("id", t.id)
      .select("id, title, priority");
    const blocked = !!error || !Array.isArray(data) || data.length === 0;
    expect(blocked).toBe(true);

    const { data: check } = await fixture.adminClient
      .from("tasks")
      .select("title, priority")
      .eq("id", t.id)
      .single();
    expect(check?.title).toBe("Original");
    expect(check?.priority).toBe("normal");
  });

  test("usuário comum conclui a própria tarefa; preenche completed_at/by; reabertura limpa", async () => {
    const t = await insertTaskAsAdmin(fixture);
    const { error: completeErr, data: completed } = await fixture.member.client
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: fixture.member.userId,
      })
      .eq("id", t.id)
      .select("id, status, completed_at, completed_by")
      .single();
    expect(completeErr).toBeNull();
    expect(completed?.status).toBe("completed");
    expect(completed?.completed_at).not.toBeNull();
    expect(completed?.completed_by).toBe(fixture.member.userId);

    const { error: reopenErr, data: reopened } = await fixture.member.client
      .from("tasks")
      .update({ status: "pending", completed_at: null, completed_by: null })
      .eq("id", t.id)
      .select("id, status, completed_at, completed_by")
      .single();
    expect(reopenErr).toBeNull();
    expect(reopened?.status).toBe("pending");
    expect(reopened?.completed_at).toBeNull();
    expect(reopened?.completed_by).toBeNull();
  });

  test("check constraint bloqueia conclusão sem completed_at/completed_by", async () => {
    const t = await insertTaskAsAdmin(fixture);
    const { error } = await fixture.adminClient
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", t.id)
      .select("id");
    expect(error).not.toBeNull();
  });

  test("admin não consegue atribuir tarefa a usuário de outra organização", async () => {
    const { error, data } = await fixture.admin.client
      .from("tasks")
      .insert({
        organization_id: fixture.orgAId,
        title: "Cross-org",
        assigned_to: fixture.outsider.userId,
        created_by: fixture.admin.userId,
      })
      .select("id");
    const blocked = !!error || !Array.isArray(data) || data.length === 0;
    expect(blocked).toBe(true);
  });

  test("admin não consegue usar unit_id de outra organização", async () => {
    const { data: otherUnit, error: uErr } = await fixture.adminClient
      .from("units")
      .insert({
        organization_id: fixture.orgBId,
        name: "Unit B",
        slug: `unit-b-${randomUUID().slice(0, 6)}`,
      })
      .select("id")
      .single();
    if (uErr || !otherUnit) throw new Error(uErr?.message);

    const { error, data } = await fixture.admin.client
      .from("tasks")
      .insert({
        organization_id: fixture.orgAId,
        unit_id: otherUnit.id,
        title: "Cross-org unit",
        assigned_to: fixture.member.userId,
        created_by: fixture.admin.userId,
      })
      .select("id");
    const blocked = !!error || !Array.isArray(data) || data.length === 0;
    expect(blocked).toBe(true);
  });

  test("admin da orgA vê todas as tarefas da orgA; nada da orgB", async () => {
    // Cria uma tarefa na orgB via service_role para não bater em policies.
    const { data: taskB, error: bErr } = await fixture.adminClient
      .from("tasks")
      .insert({
        organization_id: fixture.orgBId,
        title: "Task B",
        assigned_to: fixture.outsider.userId,
        created_by: fixture.outsider.userId,
      })
      .select("id")
      .single();
    if (bErr || !taskB) throw new Error(bErr?.message);

    const { data: seenByAdminA } = await fixture.admin.client
      .from("tasks")
      .select("id, organization_id");
    const orgs = new Set((seenByAdminA ?? []).map((t) => t.organization_id));
    expect(orgs.has(fixture.orgAId)).toBe(true);
    expect(orgs.has(fixture.orgBId)).toBe(false);
  });

  test("filtros derivados: hoje, atrasada, próxima, concluída", async () => {
    // Datas ancoradas em meio-dia de São Paulo para não depender do horário
    // em que a suíte é executada — "agora + 4h" cruzava a meia-noite quando
    // rodava depois de 20h BRT.
    const { todayYmd, addDaysYmd } = await import("../src/lib/dates/period");
    const todayYmdSp = todayYmd();
    const past = `${addDaysYmd(todayYmdSp, -2)}T12:00:00-03:00`;
    const soon = `${todayYmdSp}T12:00:00-03:00`;
    const future = `${addDaysYmd(todayYmdSp, 7)}T12:00:00-03:00`;

    const overdue = await insertTaskAsAdmin(fixture, { title: "O-Overdue", due_at: past });
    const today = await insertTaskAsAdmin(fixture, { title: "O-Today", due_at: soon });
    const upcoming = await insertTaskAsAdmin(fixture, { title: "O-Upcoming", due_at: future });
    const done = await insertTaskAsAdmin(fixture, { title: "O-Done" });
    await fixture.adminClient
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: fixture.member.userId,
      })
      .eq("id", done.id);

    // Simula as buckets como a UI faz.
    const { bucketFor } = await import("../src/lib/tasks/dates");
    const { data: mine } = await fixture.member.client.from("tasks").select("*");
    const list = mine ?? [];

    const findBucket = (id: string) => {
      const t = list.find((x) => x.id === id);
      return t ? { status: t.status, bucket: bucketFor(t.due_at) } : null;
    };

    expect(findBucket(overdue.id)).toEqual({ status: "pending", bucket: "overdue" });
    expect(findBucket(today.id)).toEqual({ status: "pending", bucket: "today" });
    expect(findBucket(upcoming.id)).toEqual({ status: "pending", bucket: "upcoming" });
    expect(findBucket(done.id)?.status).toBe("completed");
  });

  // ============================================================================
  // Cenário multiusuário — reflete o real da Loud Fit: 6 admins compartilham
  // a mesma organização e precisam ver/editar as mesmas tarefas. Prova que
  // a listagem NÃO depende do ID do criador: quando admin B abre a página
  // de tarefas, ele vê a tarefa criada por admin A dentro da mesma org.
  // ============================================================================

  test("multiusuário: admin A cria, admin B lê + edita + conclui, admin A vê", async () => {
    // (1) Admin A cria a tarefa via seu próprio client (RLS "tasks: admin all")
    const { data: created, error: createErr } = await fixture.admin.client
      .from("tasks")
      .insert({
        organization_id: fixture.orgAId,
        unit_id: fixture.unitAId,
        title: "Multiuser — visível para todos os admins",
        assigned_to: fixture.member.userId,
        created_by: fixture.admin.userId,
        priority: "normal",
      })
      .select("id, title, priority, status, created_by")
      .single();
    expect(createErr).toBeNull();
    expect(created?.id).toBeTruthy();
    expect(created?.created_by).toBe(fixture.admin.userId);

    // (2) Admin B da MESMA org enxerga a tarefa criada por admin A —
    //     RLS libera para todos os admins da org, não só o criador.
    const { data: bSees } = await fixture.adminB.client
      .from("tasks")
      .select("id, title, priority, status, created_by")
      .eq("id", created!.id)
      .maybeSingle();
    expect(bSees?.id).toBe(created!.id);
    expect(bSees?.created_by).toBe(fixture.admin.userId); // criador continua sendo A
    expect(bSees?.priority).toBe("normal");

    // (3) Admin B EDITA a tarefa — muda prioridade e reatribui.
    //     Isso só passa a policy "tasks: admin all" que aceita qualquer
    //     admin da org, independente de quem criou.
    const { error: updateErr, data: updated } = await fixture.adminB.client
      .from("tasks")
      .update({ priority: "high", assigned_to: fixture.adminB.userId })
      .eq("id", created!.id)
      .select("id, priority, assigned_to")
      .single();
    expect(updateErr).toBeNull();
    expect(updated?.priority).toBe("high");
    expect(updated?.assigned_to).toBe(fixture.adminB.userId);

    // (4) Admin A confirma que enxerga a atualização feita por B.
    const { data: aSeesUpdated } = await fixture.admin.client
      .from("tasks")
      .select("id, priority, assigned_to")
      .eq("id", created!.id)
      .single();
    expect(aSeesUpdated?.priority).toBe("high");
    expect(aSeesUpdated?.assigned_to).toBe(fixture.adminB.userId);

    // (5) Admin B conclui a tarefa (agora assigned_to == adminB.userId).
    const { error: completeErr } = await fixture.adminB.client
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: fixture.adminB.userId,
      })
      .eq("id", created!.id);
    expect(completeErr).toBeNull();

    const { data: final } = await fixture.admin.client
      .from("tasks")
      .select("status, completed_by")
      .eq("id", created!.id)
      .single();
    expect(final?.status).toBe("completed");
    expect(final?.completed_by).toBe(fixture.adminB.userId);
  });

  test("multiusuário: outsider (outra org) não lê nem edita tarefas da orgA", async () => {
    const t = await insertTaskAsAdmin(fixture, {
      title: "Task privada da orgA",
      assigned_to: fixture.member.userId,
    });

    // Outsider (admin, mas de orgB) não deve ver esta linha em SELECT
    const { data: seen } = await fixture.outsider.client
      .from("tasks")
      .select("id")
      .eq("id", t.id);
    expect((seen ?? []).length).toBe(0);

    // Outsider não deve alterar nem escrever via mesma policy
    const { data: updated, error: uErr } = await fixture.outsider.client
      .from("tasks")
      .update({ title: "hackeada" })
      .eq("id", t.id)
      .select("id");
    const blocked = !!uErr || !Array.isArray(updated) || updated.length === 0;
    expect(blocked).toBe(true);

    // Confirma via service_role que o title permanece intacto
    const { data: check } = await fixture.adminClient
      .from("tasks")
      .select("title")
      .eq("id", t.id)
      .single();
    expect(check?.title).toBe("Task privada da orgA");
  });

  test("multiusuário: listagem de admin B contém tarefas criadas por admin A na mesma org", async () => {
    // Prova extra que a listagem NÃO filtra por created_by: 3 tarefas
    // criadas por admin A devem aparecer para admin B.
    const t1 = await insertTaskAsAdmin(fixture, { title: "M1" });
    const t2 = await insertTaskAsAdmin(fixture, { title: "M2" });
    const t3 = await insertTaskAsAdmin(fixture, { title: "M3" });

    const { data: bList } = await fixture.adminB.client
      .from("tasks")
      .select("id, organization_id, title")
      .in("id", [t1.id, t2.id, t3.id]);
    const bIds = new Set((bList ?? []).map((t) => t.id));
    expect(bIds.has(t1.id)).toBe(true);
    expect(bIds.has(t2.id)).toBe(true);
    expect(bIds.has(t3.id)).toBe(true);
    // Todas pertencem à orgA
    for (const row of bList ?? []) {
      expect(row.organization_id).toBe(fixture.orgAId);
    }
  });
});
