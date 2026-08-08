// Script de inspeção visual da Fase 3. NÃO faz parte do build.
// Rode com:  node --env-file=.env.local scripts/screenshot-resultados.mjs
//
// O que faz:
// 1) Sobe um admin temporário com senha (via service_role) na org "Loud Fit".
// 2) Loga esse admin usando a página /login? Não — Supabase SSR usa magic link.
//    Em vez disso, gera a sessão via signInWithPassword no lado do Playwright
//    (injetando os cookies do Supabase SSR direto no browser).
// 3) Navega por /resultados (Ontem, 7d, filtro por unidade) e /config/campanhas.
// 4) Salva PNGs em ./screenshots/ (que já está no .gitignore).
// 5) Remove o admin temporário ao final.

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!url || !anon || !service) {
  console.error("Faltam envs: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "screenshots");
mkdirSync(OUT, { recursive: true });

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const email = `visual-${suffix}@screens.dev`;
  const password = `Vis-${randomUUID()}!`;

  const { data: user, error: uErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (uErr || !user?.user) throw new Error(`createUser: ${uErr?.message}`);

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", "loud-fit")
    .single();

  await admin.from("user_organizations").insert({
    user_id: user.user.id,
    organization_id: org.id,
    role: "admin",
  });

  const cleanup = async () => {
    await admin.auth.admin.deleteUser(user.user.id);
  };

  try {
    // Assinar
    const anonClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: session, error: sErr } = await anonClient.auth.signInWithPassword({ email, password });
    if (sErr || !session?.session) throw new Error(`signIn: ${sErr?.message}`);

    // Extrair projectRef a partir da URL do Supabase.
    const projectRef = new URL(url).host.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;
    // Supabase SSR formata como base64-<json> quando "chunked" está desligado; para simplificar usamos json direto.
    const value = JSON.stringify({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_in: session.session.expires_in,
      expires_at: session.session.expires_at,
      token_type: session.session.token_type,
      user: session.session.user,
    });

    const browser = await chromium.launch();
    const contextDesktop = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: "dark",
    });
    await contextDesktop.addCookies([
      {
        name: cookieName,
        value: "base64-" + Buffer.from(value).toString("base64"),
        url: appUrl,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const page = await contextDesktop.newPage();

    // Desktop screenshots
    const runs = [
      { path: "/resultados", file: "resultados-yesterday-desktop.png" },
      { path: "/resultados?p=last7", file: "resultados-last7-desktop.png" },
      { path: "/resultados?p=last30", file: "resultados-last30-desktop.png" },
      { path: "/config/campanhas", file: "config-campanhas-desktop.png" },
      { path: "/tarefas", file: "tarefas-desktop.png" },
    ];
    for (const r of runs) {
      await page.goto(appUrl + r.path, { waitUntil: "networkidle" });
      await page.screenshot({ path: join(OUT, r.file), fullPage: true });
      console.log("desktop:", r.file);
    }

    // Filtro por unidade — pega o primeiro <option> com valor UUID
    await page.goto(appUrl + "/resultados", { waitUntil: "networkidle" });
    const firstUnitId = await page.evaluate(() => {
      const sel = document.querySelector("select[name='unit']");
      const opt = sel && sel.querySelector("option[value]:not([value=''])");
      return opt ? opt.value : null;
    });
    if (firstUnitId && firstUnitId !== "__UNMAPPED__") {
      await page.goto(appUrl + "/resultados?unit=" + firstUnitId, { waitUntil: "networkidle" });
      await page.screenshot({
        path: join(OUT, "resultados-por-unidade-desktop.png"),
        fullPage: true,
      });
      console.log("desktop: resultados-por-unidade-desktop.png");
    }

    // Mobile (iPhone 12-ish)
    await contextDesktop.close();
    const contextMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
      isMobile: true,
      deviceScaleFactor: 2,
    });
    await contextMobile.addCookies([
      {
        name: cookieName,
        value: "base64-" + Buffer.from(value).toString("base64"),
        url: appUrl,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const pageM = await contextMobile.newPage();

    const runsMobile = [
      { path: "/resultados", file: "resultados-yesterday-mobile.png" },
      { path: "/resultados?p=last7", file: "resultados-last7-mobile.png" },
      { path: "/config/campanhas", file: "config-campanhas-mobile.png" },
      { path: "/tarefas", file: "tarefas-mobile.png" },
    ];
    for (const r of runsMobile) {
      await pageM.goto(appUrl + r.path, { waitUntil: "networkidle" });
      await pageM.screenshot({ path: join(OUT, r.file), fullPage: true });
      console.log("mobile:", r.file);
    }

    await browser.close();
  } finally {
    await cleanup();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
