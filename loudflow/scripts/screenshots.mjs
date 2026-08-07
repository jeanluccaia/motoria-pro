#!/usr/bin/env node
/**
 * Fase 2.1 — geração de screenshots para inspeção visual do MVP de tarefas.
 *
 * Uso:
 *   npm run dev  # em outro terminal
 *   node --env-file=.env.local scripts/screenshots.mjs
 *
 * Requer Chromium instalado (npx playwright install chromium).
 * Cria organização + usuários + tarefas temporárias, gera screenshots em
 * ./screenshots e apaga tudo no final (mesmo em caso de erro).
 */
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!url || !anon || !service) {
  console.error("Faltam envs.");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = randomUUID().slice(0, 8);
const created = { orgId: null, userIds: [] };

function iso(offsetMinutes) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

async function makeUser(email, displayName) {
  const password = `Ss-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  await admin.from("users").update({ name: displayName }).eq("id", data.user.id);
  created.userIds.push(data.user.id);
  return { id: data.user.id, email, password };
}

async function seed() {
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: `Screenshot Loud Fit ${suffix}`, slug: `ss-${suffix}` })
    .select("id")
    .single();
  if (orgErr) throw new Error(orgErr.message);
  created.orgId = org.id;

  const { data: units } = await admin
    .from("units")
    .insert([
      { organization_id: org.id, name: "Ipiranga", slug: `ipi-${suffix}` },
      { organization_id: org.id, name: "Amoreiras", slug: `amo-${suffix}` },
    ])
    .select("id, name");
  const ipiranga = units.find((u) => u.name === "Ipiranga");
  const amoreiras = units.find((u) => u.name === "Amoreiras");

  const adminUser = await makeUser(`carlos-${suffix}@screenshot.local`, "Carlos Souza");
  const memberUser = await makeUser(`patricia-${suffix}@screenshot.local`, "Patrícia Lima");
  const emptyAdmin = await makeUser(`renata-${suffix}@screenshot.local`, "Renata Alves");

  await admin.from("user_organizations").insert([
    { user_id: adminUser.id, organization_id: org.id, role: "admin" },
    { user_id: memberUser.id, organization_id: org.id, role: "marketing" },
    { user_id: emptyAdmin.id, organization_id: org.id, role: "admin" },
  ]);

  const tasks = [
    // ---- Carlos (adminUser) ----
    {
      organization_id: org.id, unit_id: ipiranga.id,
      title: "Confirmar aula com o novo aluno do plano anual",
      description: "Ligar pela manhã para reforçar a matrícula.",
      assigned_to: adminUser.id, created_by: adminUser.id,
      priority: "high", due_at: iso(-2 * 24 * 60), status: "pending",
    },
    {
      organization_id: org.id, unit_id: amoreiras.id,
      title: "Fechar a escala de professores da semana",
      assigned_to: adminUser.id, created_by: adminUser.id,
      priority: "high", due_at: iso(4 * 60), status: "pending",
    },
    {
      organization_id: org.id, unit_id: null,
      title: "Preparar comunicação da campanha de indicação",
      description: "Enviar para a rede pelo grupo do WhatsApp na segunda.",
      assigned_to: adminUser.id, created_by: adminUser.id,
      priority: "normal", due_at: iso(3 * 24 * 60), status: "pending",
    },
    {
      organization_id: org.id, unit_id: ipiranga.id,
      title: "Repor toalhas na recepção",
      assigned_to: adminUser.id, created_by: adminUser.id,
      priority: "normal", due_at: iso(-1 * 24 * 60), status: "completed",
      completed_at: iso(-6 * 60), completed_by: adminUser.id,
    },
    // Segunda tarefa "hoje" pra sobrar após concluir uma na captura do toast:
    {
      organization_id: org.id, unit_id: ipiranga.id,
      title: "Postar foto do treino da manhã",
      assigned_to: adminUser.id, created_by: adminUser.id,
      priority: "normal", due_at: iso(6 * 60), status: "pending",
    },
    // ---- Patrícia (memberUser) — aparece na visão de Equipe ----
    {
      organization_id: org.id, unit_id: amoreiras.id,
      title: "Postar depoimento do aluno do mês",
      assigned_to: memberUser.id, created_by: adminUser.id,
      priority: "normal", due_at: iso(2 * 60), status: "pending",
    },
    {
      organization_id: org.id, unit_id: null,
      title: "Revisar leads da última semana",
      assigned_to: memberUser.id, created_by: adminUser.id,
      priority: "high", due_at: iso(-6 * 60), status: "pending",
    },
  ];
  const { error: tErr } = await admin.from("tasks").insert(tasks);
  if (tErr) throw new Error(tErr.message);

  return { adminUser, memberUser, emptyAdmin };
}

async function signInStorageState(email, password) {
  const jar = new Map();
  const client = createServerClient(url, anon, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const host = new URL(APP).hostname;
  return {
    cookies: Array.from(jar.entries()).map(([name, value]) => ({
      name, value, domain: host, path: "/", expires: -1,
      httpOnly: false, secure: false, sameSite: "Lax",
    })),
    origins: [],
  };
}

const outDir = path.resolve("screenshots");

async function shoot(page, filename, opts = {}) {
  const p = path.join(outDir, filename);
  await page.screenshot({ path: p, fullPage: opts.fullPage ?? true });
  console.log(`  ✓ ${filename}`);
}

async function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  console.log("→ Seed…");
  const { adminUser, emptyAdmin } = await seed();
  const adminState = await signInStorageState(adminUser.email, adminUser.password);
  const emptyState = await signInStorageState(emptyAdmin.email, emptyAdmin.password);

  const browser = await chromium.launch();

  // ============ DESKTOP ============
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: adminState,
  });
  desktop.setDefaultTimeout(15_000);

  console.log("→ Desktop screenshots…");

  // 01 — Minhas tarefas (Hoje, default)
  const p1 = await desktop.newPage();
  p1.on("pageerror", (e) => console.error("pageerror:", e.message));
  await p1.goto(`${APP}/tarefas`, { waitUntil: "networkidle" });
  await shoot(p1, "01-minhas-desktop.png");

  // 03 — Filtro Atrasadas
  await p1.getByRole("tab", { name: /^Atrasadas/ }).click();
  await p1.waitForTimeout(300);
  await shoot(p1, "03-filtro-atrasadas-desktop.png");

  // 04 — Filtro Concluídas
  await p1.getByRole("tab", { name: /^Concluídas/ }).click();
  await p1.waitForTimeout(300);
  await shoot(p1, "04-filtro-concluidas-desktop.png");

  // 07 — Equipe
  await p1.getByRole("tab", { name: /^Equipe$/ }).click();
  await p1.waitForTimeout(300);
  await p1.getByRole("tab", { name: /^Hoje/ }).click();
  await p1.waitForTimeout(300);
  await shoot(p1, "07-equipe-desktop.png");

  // 05 — Nova tarefa (dialog)
  await p1.getByRole("tab", { name: /^Minhas tarefas$/ }).click();
  await p1.waitForTimeout(200);
  await p1.getByRole("button", { name: /Nova tarefa/i }).click();
  await p1.waitForSelector('[role="dialog"]');
  await p1.waitForTimeout(300);
  await shoot(p1, "05-nova-tarefa-desktop.png", { fullPage: false });
  await p1.keyboard.press("Escape");
  await p1.close();

  // 08 — Estado vazio (admin sem nada atribuído)
  const emptyDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: emptyState,
  });
  const p8 = await emptyDesktop.newPage();
  await p8.goto(`${APP}/tarefas`, { waitUntil: "networkidle" });
  await p8.waitForTimeout(300);
  await shoot(p8, "08-estado-vazio-desktop.png");
  await p8.close();
  await emptyDesktop.close();

  // 09 e 10 — Confirmação após concluir + Desfazer
  const p9 = await desktop.newPage();
  p9.on("pageerror", (e) => console.error("pageerror:", e.message));
  await p9.goto(`${APP}/tarefas`, { waitUntil: "networkidle" });
  // Filtro "Hoje" default. Existem 2 tarefas de hoje.
  const complete = p9.getByRole("button", { name: /Concluir tarefa/i }).first();
  await complete.waitFor({ state: "visible" });
  await complete.click();
  // A UI mostra "Desfazer (Ns)" dentro do card. Espera o botão aparecer.
  await p9.getByRole("button", { name: /Desfazer/ }).first().waitFor({ state: "visible" });
  await p9.waitForTimeout(400);
  await shoot(p9, "09-confirmacao-concluir.png");
  // 10 — recorte focado só no toast fixo com o botão Desfazer.
  const undoBar = p9.locator("[role='status']").filter({ hasText: /Desfazer/ }).first();
  const box = await undoBar.boundingBox({ timeout: 2_000 }).catch(() => null);
  if (box) {
    await p9.screenshot({
      path: path.join(outDir, "10-desfazer.png"),
      clip: {
        x: Math.max(0, box.x - 24),
        y: Math.max(0, box.y - 24),
        width: Math.min(1440, box.width + 48),
        height: box.height + 48,
      },
    });
    console.log("  ✓ 10-desfazer.png");
  } else {
    await shoot(p9, "10-desfazer.png");
  }
  await p9.close();

  await desktop.close();

  // ============ MOBILE ============
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    storageState: adminState,
  });
  mobile.setDefaultTimeout(15_000);

  console.log("→ Mobile screenshots…");

  const m1 = await mobile.newPage();
  m1.on("pageerror", (e) => console.error("pageerror:", e.message));
  await m1.goto(`${APP}/tarefas`, { waitUntil: "networkidle" });
  await m1.waitForTimeout(400);
  await shoot(m1, "02-minhas-mobile.png");

  await m1.getByRole("button", { name: /Nova tarefa/i }).click();
  await m1.waitForSelector('[role="dialog"]');
  await m1.waitForTimeout(400);
  await shoot(m1, "06-nova-tarefa-mobile.png");
  await m1.close();

  await mobile.close();
  await browser.close();
}

async function teardown() {
  console.log("→ Removendo fixtures…");
  for (const uid of created.userIds) {
    try { await admin.auth.admin.deleteUser(uid); } catch { /* noop */ }
  }
  if (created.orgId) {
    await admin.from("organizations").delete().eq("id", created.orgId);
  }
}

try {
  await main();
  console.log("Screenshots gerados em ./screenshots");
} catch (e) {
  console.error("ERRO:", e);
  process.exitCode = 1;
} finally {
  await teardown();
  console.log("Fixtures removidos.");
}
