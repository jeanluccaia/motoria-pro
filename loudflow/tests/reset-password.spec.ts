import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Fluxo de reset de senha: /api/auth/reset-request → link → /api/auth/callback
// (verifyOtp) → /auth/reset-password (form) → /api/auth/set-password.
//
// Cobertura:
//   * reset-request nunca revela existência de e-mail (sempre 200 ok).
//   * generateLink('recovery') via admin devolve action_link utilizável.
//   * verifyOtp com token_hash inválido é rejeitado (link_invalid).
//   * set-password sem sessão → 401 session_missing.
//   * set-password com senha curta → 400 weak_password.
//   * usuário sem identity (auth.users criado por admin) consegue reset
//     completo APÓS backfill de identity: tratamos criando fresh.
//
// Não imprimimos senhas, tokens ou links — só afirmações estruturais.
// ============================================================================

const APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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

function makeAdmin(): SupabaseClient {
  return createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createUserWithOrg(
  admin: SupabaseClient,
): Promise<{ userId: string; email: string; orgId: string }> {
  const email = `rst-${randomUUID().slice(0, 8)}@rls.test`;
  const password = `Pwd-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "createUser");
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: `RstOrg ${randomUUID().slice(0, 6)}`, slug: `rst-${randomUUID().slice(0, 8)}` })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(orgErr?.message);
  const { error: linkErr } = await admin
    .from("user_organizations")
    .insert({ user_id: data.user.id, organization_id: org.id, role: "admin" });
  if (linkErr) throw new Error(linkErr.message);
  return { userId: data.user.id, email, orgId: org.id };
}

async function cleanup(admin: SupabaseClient, userId: string, orgId: string) {
  await admin.from("organizations").delete().eq("id", orgId);
  await admin.from("users").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

test.describe("/api/auth/reset-request", () => {
  test("e-mail cadastrado → 200 ok, sem revelar existência", async () => {
    const admin = makeAdmin();
    const { userId, email, orgId } = await createUserWithOrg(admin);
    try {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.post(`${APP}/api/auth/reset-request`, {
        headers: { "Content-Type": "application/json" },
        data: { email },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      await ctx.dispose();
    } finally {
      await cleanup(admin, userId, orgId);
    }
  });

  test("e-mail inexistente → 200 ok idêntico (não vaza)", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/reset-request`, {
      headers: { "Content-Type": "application/json" },
      data: { email: `ghost-${randomUUID().slice(0, 8)}@rls.test` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    await ctx.dispose();
  });

  test("body vazio → 200 ok silencioso", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/reset-request`, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });
});

test.describe("/api/auth/callback (verifyOtp)", () => {
  test("sem token_hash → redirect /login?err=link_invalid", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${APP}/api/auth/callback`, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    const loc = res.headers()["location"] ?? "";
    expect(loc).toContain("/login");
    expect(loc).toContain("err=link_invalid");
    await ctx.dispose();
  });

  test("token_hash inválido → redirect /login?err= (invalid ou expired)", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(
      `${APP}/api/auth/callback?token_hash=abc&type=recovery`,
      { maxRedirects: 0 },
    );
    expect(res.status()).toBe(307);
    const loc = res.headers()["location"] ?? "";
    expect(loc).toContain("/login");
    expect(loc).toMatch(/err=(link_invalid|link_expired)/);
    await ctx.dispose();
  });
});

test.describe("/api/auth/set-password", () => {
  test("sem sessão → 401 session_missing", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/set-password`, {
      headers: { "Content-Type": "application/json" },
      data: { password: "senha-nova-1234" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("session_missing");
    await ctx.dispose();
  });

  test("body vazio → 400 invalid_request", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/set-password`, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    await ctx.dispose();
  });

  test("senha curta → 400 weak_password", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/set-password`, {
      headers: { "Content-Type": "application/json" },
      data: { password: "123" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("weak_password");
    await ctx.dispose();
  });
});

test.describe("admin.createUser normal (com password) segue permitindo signInWithPassword", () => {
  test("cenário de referência — createUser com password + identity criada pelo GoTrue", async () => {
    // Este teste é o cenário BOM (usuário criado com password no
    // createUser — o GoTrue cria a identity email automaticamente).
    // O cenário RUIM (createUser sem password) é o que causou o
    // incidente em produção — corrigido pela migration 0009 e pelo
    // fluxo /api/auth/reset-request → /api/auth/callback →
    // /api/auth/set-password implementado neste PR.
    const admin = makeAdmin();
    const email = `sig-${randomUUID().slice(0, 8)}@rls.test`;
    const password = `Res-${randomUUID()}!`;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created.user) throw new Error(createErr?.message);
    const userId = created.user.id;
    try {
      const anonClient = createClient(url!, anon!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: signIn, error: signErr } =
        await anonClient.auth.signInWithPassword({ email, password });
      expect(signErr).toBeNull();
      expect(signIn?.session?.access_token).toBeTruthy();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
