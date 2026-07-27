import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  computeAdminSessionToken,
  DGN_ADMIN_COOKIE,
  DGN_ADMIN_COOKIE_OPTIONS,
  DGN_ADMIN_SESSION_MAX_AGE,
  validateAdminSessionToken,
} from "./admin-session-core.ts";

test("sessao administrativa usa um cookie estavel por oito horas", async () => {
  const token = await computeAdminSessionToken("senha-controlada");
  assert.equal(DGN_ADMIN_COOKIE, "dgn_admin_session");
  assert.equal(token.length, 64);
  assert.equal(await validateAdminSessionToken(token, "senha-controlada"), true);
  assert.equal(await validateAdminSessionToken(token, "outra-senha"), false);
  assert.deepEqual(DGN_ADMIN_COOKIE_OPTIONS, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DGN_ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
  assert.equal(DGN_ADMIN_SESSION_MAX_AGE, 60 * 60 * 8);
  assert.equal("domain" in DGN_ADMIN_COOKIE_OPTIONS, false);
});

test("login cria cookie e redirect na mesma resposta", async () => {
  const route = await readFile(new URL("../../app/admin/growth/session/route.ts", import.meta.url), "utf8");
  assert.match(route, /NextResponse\.redirect\(new URL\("\/admin\/growth"/);
  assert.match(route, /response\.cookies\.set\(DGN_ADMIN_COOKIE/);
  assert.doesNotMatch(route, /cookies\(\)/);
});

test("proxy, APIs e logout compartilham o mesmo cookie", async () => {
  const files = await Promise.all([
    "../../proxy.ts",
    "../../app/admin/growth/logout/route.ts",
    "./db/campaign-route.ts",
    "./db/commercial-route.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of files) assert.match(source, /DGN_ADMIN_COOKIE/);
  assert.match(files[0], /validateAdminSessionToken/);
  assert.match(files[1], /maxAge: 0/);
});

test("logout responde só a POST — GET seria prefetchado pelo Link e mataria a sessão", async () => {
  const route = await readFile(new URL("../../app/admin/growth/logout/route.ts", import.meta.url), "utf8");
  assert.match(route, /export function POST/);
  assert.doesNotMatch(route, /export function GET/);
});

test("workspace usa form POST para logout, não Link (impede prefetch)", async () => {
  const workspace = await readFile(new URL("../../components/growth/DgnGrowthWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /action="\/admin\/growth\/logout"\s+method="post"/);
  assert.doesNotMatch(workspace, /<Link[^>]+href="\/admin\/growth\/logout"/);
});

test("proxy bypass inclui logout — para não exigir sessão válida ao sair", async () => {
  const proxy = await readFile(new URL("../../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /\/admin\/growth\/logout/);
});
