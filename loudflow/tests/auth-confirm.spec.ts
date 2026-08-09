import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================================================================
// /auth/confirm — fluxo SSR do Magic Link (verifyOtp + token_hash).
//
// Cobre a regressão exata reportada no celular: no fluxo PKCE antigo o
// Mail app abria o link em outro navegador (sem code_verifier no
// localStorage) e a troca falhava silenciosamente devolvendo o usuário
// para /login. Agora o token_hash é validado pelo servidor e não
// depende de nada do navegador que pediu o e-mail.
//
// Não expomos token nem cookie no console — só assertivas.
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

async function createEphemeralUser(admin: SupabaseClient) {
  const email = `confirm-${randomUUID().slice(0, 8)}@rls.test`;
  const password = `Cfm-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "createUser falhou");
  return { userId: data.user.id, email, password };
}

async function generateMagicLinkTokenHash(
  admin: SupabaseClient,
  email: string,
): Promise<string> {
  // admin.generateLink retorna as propriedades do link sem disparar
  // e-mail. hashed_token é o valor que o /auth/confirm envia ao
  // supabase.auth.verifyOtp — idêntico ao que o Supabase colocaria no
  // template `{{ .TokenHash }}` do Magic Link.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data?.properties?.hashed_token) {
    throw new Error(`generateLink: ${error?.message ?? "sem hashed_token"}`);
  }
  return data.properties.hashed_token;
}

test.describe("/auth/confirm — fluxo SSR do Magic Link", () => {
  test("sem token_hash → 307 para /login?error=link_invalido", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${APP}/auth/confirm`, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    const loc = res.headers()["location"] ?? "";
    expect(loc).toContain("/login");
    expect(loc).toContain("error=link_invalido");
    await ctx.dispose();
  });

  test("token_hash inválido → 307 para /login?error=link_expirado", async () => {
    const ctx = await playwrightRequest.newContext();
    // Um token com formato plausível mas nunca emitido pelo Supabase.
    // Deve cair no branch de `verifyOtp` retornando erro.
    const fakeToken = "0".repeat(64);
    const res = await ctx.get(
      `${APP}/auth/confirm?token_hash=${fakeToken}&type=email`,
      { maxRedirects: 0 },
    );
    expect(res.status()).toBe(307);
    const loc = res.headers()["location"] ?? "";
    expect(loc).toContain("/login");
    expect(loc).toContain("error=link_expirado");
    await ctx.dispose();
  });

  test("token_hash válido → cria sessão e redireciona para next sanitizado", async () => {
    const admin = makeAdmin();
    const { userId, email } = await createEphemeralUser(admin);
    try {
      const tokenHash = await generateMagicLinkTokenHash(admin, email);

      const ctx = await playwrightRequest.newContext();
      const res = await ctx.get(
        `${APP}/auth/confirm?token_hash=${tokenHash}&type=email&next=/tarefas`,
        { maxRedirects: 0 },
      );
      // Espera um redirect (307) para /tarefas (o `next` foi sanitizado
      // via safeNext e a sessão foi persistida em cookies do Supabase).
      expect(res.status()).toBe(307);
      const loc = res.headers()["location"] ?? "";
      // Nunca cai no /login — sessão foi criada.
      expect(loc).not.toContain("/login");
      expect(loc).toContain("/tarefas");

      // Confirma que pelo menos um cookie do Supabase foi setado.
      // Não logamos valores — só a presença por nome.
      const setCookieHeaders = res.headersArray().filter(
        (h) => h.name.toLowerCase() === "set-cookie",
      );
      const cookieNames = setCookieHeaders
        .map((h) => h.value.split(";")[0].split("=")[0])
        .filter((name) => name.startsWith("sb-"));
      expect(
        cookieNames.length,
        "esperado pelo menos um cookie sb-* após verifyOtp",
      ).toBeGreaterThan(0);

      await ctx.dispose();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("token_hash válido com next malicioso é neutralizado para /resultados", async () => {
    const admin = makeAdmin();
    const { userId, email } = await createEphemeralUser(admin);
    try {
      const tokenHash = await generateMagicLinkTokenHash(admin, email);

      const ctx = await playwrightRequest.newContext();
      const evilNext = encodeURIComponent("//evil.example/x");
      const res = await ctx.get(
        `${APP}/auth/confirm?token_hash=${tokenHash}&type=email&next=${evilNext}`,
        { maxRedirects: 0 },
      );
      expect(res.status()).toBe(307);
      const loc = res.headers()["location"] ?? "";
      // Nunca vaza para o host malicioso.
      expect(loc).not.toContain("evil.example");
      expect(loc).toContain("/resultados");
      await ctx.dispose();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("Magic Link é single-use — segunda validação do mesmo token cai em link_expirado", async () => {
    const admin = makeAdmin();
    const { userId, email } = await createEphemeralUser(admin);
    try {
      const tokenHash = await generateMagicLinkTokenHash(admin, email);

      const ctx1 = await playwrightRequest.newContext();
      const first = await ctx1.get(
        `${APP}/auth/confirm?token_hash=${tokenHash}&type=email`,
        { maxRedirects: 0 },
      );
      expect(first.status()).toBe(307);
      const firstLoc = first.headers()["location"] ?? "";
      expect(firstLoc).not.toContain("/login");
      await ctx1.dispose();

      // Segunda tentativa sem sessão prévia — simula um atacante ou um
      // clique duplo no e-mail. Deve ser rejeitada.
      const ctx2 = await playwrightRequest.newContext();
      const second = await ctx2.get(
        `${APP}/auth/confirm?token_hash=${tokenHash}&type=email`,
        { maxRedirects: 0 },
      );
      expect(second.status()).toBe(307);
      const secondLoc = second.headers()["location"] ?? "";
      expect(secondLoc).toContain("/login");
      expect(secondLoc).toContain("error=link_expirado");
      await ctx2.dispose();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});

test.describe("/login — exibe erro amigável", () => {
  test("?error=link_expirado renderiza mensagem clara", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${APP}/login?error=link_expirado`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("expirou ou já foi utilizado");
    expect(body).toContain("Solicite um novo acesso");
    await ctx.dispose();
  });

  test("?error=link_invalido renderiza mensagem clara", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${APP}/login?error=link_invalido`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Solicite um novo acesso");
    await ctx.dispose();
  });

  test("?error desconhecido → mensagem genérica, nunca silenciosa", async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${APP}/login?error=coisa-nova`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Não conseguimos concluir o login");
    await ctx.dispose();
  });
});
