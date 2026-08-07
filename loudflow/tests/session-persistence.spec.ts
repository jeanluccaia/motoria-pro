import { test, expect, request as playwrightRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";

// ============================================================================
// Fase 2 — Persistência da sessão do Supabase SSR.
//
// Fluxo:
//   1. Cria um admin efêmero + org.
//   2. Loga uma vez e coleta os cookies emitidos pelo Supabase (equivale à
//      volta do magic link).
//   3. Simula "fechar o navegador" descartando o contexto Playwright original.
//   4. Abre um novo contexto reutilizando exatamente aqueles cookies (o
//      Supabase mantém sessão em cookies persistentes; nenhum token
//      manual/localStorage é usado).
//   5. Acessa /tarefas: precisa devolver 200 sem redirect para /login.
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

test.describe("Persistência da sessão — Fase 2", () => {
  test("cookies do Supabase sobrevivem a fechar e reabrir o navegador", async () => {
    const admin = makeAdmin();
    const email = `persist-${randomUUID().slice(0, 8)}@rls.test`;
    const password = `Prs-${randomUUID()}!`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(error?.message);
    const userId = data.user.id;

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: "Persist Test", slug: `persist-${randomUUID().slice(0, 8)}` })
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

      // 1) Login inicial gera o storage state com cookies persistentes.
      const storageState = await signInAsStorageState(email, password);
      expect(storageState.cookies.length).toBeGreaterThan(0);

      // 2) "Primeiro browser": bate em /tarefas e confirma 200.
      const first = await playwrightRequest.newContext({ storageState });
      const res1 = await first.get(`${APP}/tarefas`, { maxRedirects: 0 });
      expect(res1.status()).toBe(200);
      await first.dispose();

      // 3) "Fechar e reabrir o browser": novo contexto reusando o mesmo
      //    storageState (persistência baseada em cookies do Supabase SSR).
      //    Nenhum token/localStorage adicional é envolvido.
      const second = await playwrightRequest.newContext({ storageState });
      const res2 = await second.get(`${APP}/tarefas`, { maxRedirects: 0 });
      expect(res2.status()).toBe(200);
      // Não deve pedir login de novo.
      expect(res2.headers()["location"]).toBeFalsy();
      await second.dispose();
    } finally {
      await admin.from("organizations").delete().eq("id", org.id);
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
