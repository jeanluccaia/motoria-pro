import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// Login por e-mail + senha via /api/auth/signin.
//
// Cobertura pedida na decisão do MVP (abandono do Magic Link):
//   * login válido cria sessão persistente
//   * senha errada é rejeitada, sem sessão
//   * usuário inexistente é rejeitado com o MESMO código de erro
//     (invalid_credentials) — não vazar existência de conta
//   * persistência: os cookies gravados no POST fazem GET / passar
//   * logout limpa cookies e volta para /login em 1 salto
//
// Nunca imprimimos senha, cookie ou token — só afirmações estruturais.
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

type Actor = { userId: string; email: string; password: string };

async function createUserWithOrg(
  admin: SupabaseClient,
  role: "admin" | "marketing" | "partner" | "unit_manager",
): Promise<{ actor: Actor; orgId: string }> {
  const email = `pw-${randomUUID().slice(0, 8)}@rls.test`;
  const password = `Pwd-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "createUser");
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: `PWOrg ${randomUUID().slice(0, 6)}`, slug: `pw-${randomUUID().slice(0, 8)}` })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(orgErr?.message);
  const { error: linkErr } = await admin
    .from("user_organizations")
    .insert({ user_id: data.user.id, organization_id: org.id, role });
  if (linkErr) throw new Error(linkErr.message);
  return {
    actor: { userId: data.user.id, email, password },
    orgId: org.id,
  };
}

async function cleanup(admin: SupabaseClient, userId: string, orgId: string) {
  await admin.from("organizations").delete().eq("id", orgId);
  await admin.from("users").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

// Extrai só os NOMES dos cookies do Supabase da resposta — nunca o
// valor. Útil para afirmar "gravou uma sessão" sem expor o token.
function supabaseCookieNames(res: {
  headersArray: () => { name: string; value: string }[];
}): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value.split(";")[0].split("=")[0])
    .filter((n) => n.startsWith("sb-"));
}

test.describe("/api/auth/signin — email + senha", () => {
  test("login válido → 200 + cookies sb-* + redirect saneado", async () => {
    const admin = makeAdmin();
    const { actor, orgId } = await createUserWithOrg(admin, "admin");
    try {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.post(`${APP}/api/auth/signin`, {
        headers: { "Content-Type": "application/json" },
        data: {
          email: actor.email,
          password: actor.password,
          next: "/tarefas",
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.redirect).toBe("/tarefas");

      const names = supabaseCookieNames(res);
      expect(names.length, "esperado pelo menos 1 cookie sb-*").toBeGreaterThan(0);

      await ctx.dispose();
    } finally {
      await cleanup(admin, actor.userId, orgId);
    }
  });

  test("login válido com `next` malicioso é neutralizado para /resultados", async () => {
    const admin = makeAdmin();
    const { actor, orgId } = await createUserWithOrg(admin, "admin");
    try {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.post(`${APP}/api/auth/signin`, {
        headers: { "Content-Type": "application/json" },
        data: {
          email: actor.email,
          password: actor.password,
          next: "//evil.example/x",
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.redirect).toBe("/resultados");
      await ctx.dispose();
    } finally {
      await cleanup(admin, actor.userId, orgId);
    }
  });

  test("senha errada → 401 invalid_credentials, sem cookies sb-*", async () => {
    const admin = makeAdmin();
    const { actor, orgId } = await createUserWithOrg(admin, "admin");
    try {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.post(`${APP}/api/auth/signin`, {
        headers: { "Content-Type": "application/json" },
        data: { email: actor.email, password: `${actor.password}xx` },
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("invalid_credentials");
      expect(supabaseCookieNames(res).length).toBe(0);
      await ctx.dispose();
    } finally {
      await cleanup(admin, actor.userId, orgId);
    }
  });

  test("usuário inexistente → 401 invalid_credentials (mesmo código)", async () => {
    // Não vazamos existência: e-mail que nunca foi cadastrado deve
    // devolver exatamente o mesmo erro que senha errada.
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/signin`, {
      headers: { "Content-Type": "application/json" },
      data: {
        email: `nobody-${randomUUID().slice(0, 8)}@rls.test`,
        password: "qualquer-senha-1234",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("invalid_credentials");
    expect(supabaseCookieNames(res).length).toBe(0);
    await ctx.dispose();
  });

  test("body sem email/senha → 400 invalid_request", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.post(`${APP}/api/auth/signin`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "", password: "" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    await ctx.dispose();
  });

  test("persistência: cookies do signin sobrevivem a GET /", async () => {
    const admin = makeAdmin();
    const { actor, orgId } = await createUserWithOrg(admin, "admin");
    try {
      // Contexto persistente — cookies do POST viajam nas próximas
      // requisições. Simula o navegador do usuário depois do login.
      const ctx = await playwrightRequest.newContext();
      const loginRes = await ctx.post(`${APP}/api/auth/signin`, {
        headers: { "Content-Type": "application/json" },
        data: { email: actor.email, password: actor.password },
      });
      expect(loginRes.status()).toBe(200);

      // GET / — admin da orgA vai encontrar a org, requireSession não
      // redireciona para /login nem para /pending.
      const home = await ctx.get(`${APP}/`, { maxRedirects: 0 });
      expect(home.status()).toBe(200);
      await ctx.dispose();
    } finally {
      await cleanup(admin, actor.userId, orgId);
    }
  });

  test("logout: POST /api/auth/signout limpa cookies e /login volta a bloquear", async () => {
    const admin = makeAdmin();
    const { actor, orgId } = await createUserWithOrg(admin, "admin");
    try {
      const ctx = await playwrightRequest.newContext();
      await ctx.post(`${APP}/api/auth/signin`, {
        headers: { "Content-Type": "application/json" },
        data: { email: actor.email, password: actor.password },
      });

      const out = await ctx.post(`${APP}/api/auth/signout`, { maxRedirects: 0 });
      expect(out.status()).toBe(303);
      expect(out.headers()["location"]).toContain("/login");

      const home = await ctx.get(`${APP}/`, { maxRedirects: 0 });
      expect(home.status()).toBe(307);
      expect(home.headers()["location"]).toContain("/login");
      await ctx.dispose();
    } finally {
      await cleanup(admin, actor.userId, orgId);
    }
  });
});
