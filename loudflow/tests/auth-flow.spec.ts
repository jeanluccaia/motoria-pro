import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";

// ============================================================================
// Fluxo de autenticação — Fase 1
//
// Verifica:
//   (a) Visitante anônimo é redirecionado para /login em exatamente 1 salto.
//   (b) Usuário autenticado SEM organização é enviado a /pending (sem loop).
//   (c) Administrador vinculado acessa /.
//   (d) Nenhum caminho gera mais de 3 redirects (proteção contra loop).
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

type StorageState = Parameters<typeof playwrightRequest.newContext>[0] extends
  | infer O
  | undefined
  ? O extends { storageState?: infer S }
    ? Exclude<S, string | undefined>
    : never
  : never;

async function signInAsStorageState(email: string, password: string): Promise<StorageState> {
  const jar = new Map<string, string>();
  const client = createServerClient(url!, anon!, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn: ${error.message}`);
  const host = new URL(APP).hostname;
  return {
    cookies: Array.from(jar.entries()).map(([name, value]) => ({
      name,
      value,
      domain: host,
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
    origins: [],
  };
}

function makeAdmin(): SupabaseClient {
  return createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createEphemeralUser(admin: SupabaseClient) {
  const email = `flow-${randomUUID().slice(0, 8)}@rls.test`;
  const password = `Flw-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "createUser falhou");
  return { userId: data.user.id, email, password };
}

test.describe("Auth flow — Fase 1", () => {
  test("(a) visitante anônimo é redirecionado para /login em 1 salto", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${APP}/`, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/login");

    const followed = await ctx.get(`${APP}/`, { maxRedirects: 5 });
    expect(followed.status()).toBe(200);
    expect(followed.url()).toContain("/login");
    await ctx.dispose();
  });

  test("(b) autenticado sem organização vai para /pending, sem loop", async () => {
    const admin = makeAdmin();
    const { userId, email, password } = await createEphemeralUser(admin);
    try {
      const storageState = await signInAsStorageState(email, password);
      const ctx = await playwrightRequest.newContext({ storageState });

      // 1 salto: / -> /pending
      const first = await ctx.get(`${APP}/`, { maxRedirects: 0 });
      expect(first.status()).toBe(307);
      expect(first.headers()["location"]).toContain("/pending");

      // /pending renderiza 200 com a mensagem
      const pending = await ctx.get(`${APP}/pending`, { maxRedirects: 0 });
      expect(pending.status()).toBe(200);
      const body = await pending.text();
      expect(body).toContain("aguardando liberação");
      expect(body).toContain(email);

      // Seguindo redirects a partir de /, deve parar em /pending sem loop
      const followed = await ctx.get(`${APP}/`, { maxRedirects: 5 });
      expect(followed.status()).toBe(200);
      expect(followed.url()).toContain("/pending");
      await ctx.dispose();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("(c) administrador vinculado acessa /", async () => {
    const admin = makeAdmin();
    const { userId, email, password } = await createEphemeralUser(admin);
    const orgSlug = `flow-${randomUUID().slice(0, 8)}`;
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: "Flow Test", slug: orgSlug })
      .select("id")
      .single();
    if (orgErr || !org) throw new Error(orgErr?.message);
    try {
      const { error: linkErr } = await admin.from("user_organizations").insert({
        user_id: userId,
        organization_id: org.id,
        role: "admin",
      });
      if (linkErr) throw new Error(linkErr.message);

      const storageState = await signInAsStorageState(email, password);
      const ctx = await playwrightRequest.newContext({ storageState });
      const res = await ctx.get(`${APP}/`, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      await ctx.dispose();
    } finally {
      await admin.from("organizations").delete().eq("id", org.id);
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("(d) limite de 3 redirects: nenhum cenário estoura", async () => {
    // Anônimo: 1 redirect
    const anonCtx = await playwrightRequest.newContext();
    const anonRes = await anonCtx.get(`${APP}/`, { maxRedirects: 3 });
    expect(anonRes.status()).toBe(200);
    await anonCtx.dispose();

    // Autenticado sem org: 1 redirect
    const admin = makeAdmin();
    const { userId, email, password } = await createEphemeralUser(admin);
    try {
      const storageState = await signInAsStorageState(email, password);
      const ctx = await playwrightRequest.newContext({ storageState });
      const res = await ctx.get(`${APP}/`, { maxRedirects: 3 });
      expect(res.status()).toBe(200);
      expect(res.url()).toContain("/pending");
      await ctx.dispose();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
