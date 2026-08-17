#!/usr/bin/env node
/**
 * ETAPA 9 — teste real de isolamento cruzado do Portal.
 *
 * READ-ONLY para o modelo de dados: cria 2 usuários de teste em
 * auth.users (idempotente), 2 links em crm_customer_auth mapeando
 * para José (Nº002) e Wellington. NÃO envia magic link, NÃO grava
 * nada no CRM comercial.
 *
 * Depois autentica via password (senha só server-side), chama a RPC
 * `portal_get_current_subscriber()` como cada usuário, e verifica que:
 *
 *   - usuário A (linkado ao José) recebe SOMENTE o José;
 *   - usuário B (linkado ao Wellington) recebe SOMENTE o Wellington;
 *   - nenhum consegue ler dados do outro;
 *   - sem sessão, RPC retorna { linked:false }.
 *
 * Ao final, limpa: remove os 2 links e os 2 usuários de teste.
 *
 * Uso:
 *   node --env-file=.env.local db/scripts/subscriber-import/test-portal-isolation.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) {
  console.error("faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const JOSE_ID = "7c54d056-e1aa-487e-a579-382460c24aaf";
const WELLINGTON_ID = "2fc9edee-d3cd-4365-af5a-ac02c1ccb0bb";
const TEST_A = { email: "test-portal-jose@dgn-test.local", password: "portal-isolation-test-" + crypto.randomUUID() };
const TEST_B = { email: "test-portal-wellington@dgn-test.local", password: "portal-isolation-test-" + crypto.randomUUID() };

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function ok(label) {
  console.log(`  ✓ ${label}`);
}
function bad(label, extra) {
  console.error(`  ✗ ${label}${extra ? " — " + extra : ""}`);
  process.exitCode = 1;
}

async function upsertUser(u) {
  // procura por e-mail; se existir usa aquele id
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.users.find((x) => x.email === u.email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: u.password, email_confirm: true });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function link(auth_user_id, customer_id) {
  const { error } = await admin.from("crm_customer_auth").upsert(
    { auth_user_id, customer_id },
    { onConflict: "auth_user_id" },
  );
  if (error) throw error;
}

async function unlink(auth_user_id) {
  await admin.from("crm_customer_auth").delete().eq("auth_user_id", auth_user_id);
}

async function cleanupUser(auth_user_id) {
  await unlink(auth_user_id);
  await admin.auth.admin.deleteUser(auth_user_id);
}

async function callRpcAs(u) {
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: sErr } = await client.auth.signInWithPassword({
    email: u.email,
    password: u.password,
  });
  if (sErr) throw new Error(`sign-in ${u.email}: ${sErr.message}`);
  const { data, error } = await client.rpc("portal_get_current_subscriber");
  await client.auth.signOut();
  if (error) throw new Error(`rpc ${u.email}: ${error.message}`);
  return data;
}

console.log("[isolation] setup — criando 2 usuários e vínculos de teste");
const userA = await upsertUser(TEST_A);
const userB = await upsertUser(TEST_B);
await link(userA, JOSE_ID);
await link(userB, WELLINGTON_ID);
ok(`user A (${TEST_A.email}) → José ${JOSE_ID}`);
ok(`user B (${TEST_B.email}) → Wellington ${WELLINGTON_ID}`);

let cleanupNeeded = true;
try {
  console.log("[isolation] sem sessão");
  const anonClient = createClient(url, anon, { auth: { persistSession: false } });
  const { data: anonRes, error: anonErr } = await anonClient.rpc("portal_get_current_subscriber");
  // Safe outcome = either linked:false OR permission_denied (anon não tem grant EXECUTE)
  if (anonErr) {
    if (/permission denied|permission_denied|not authorized/i.test(anonErr.message)) {
      ok(`sem sessão → permission_denied (anon sem grant): ${anonErr.message}`);
    } else {
      bad("sem sessão retornou erro inesperado", anonErr.message);
    }
  } else if (!anonRes || anonRes.linked !== false) {
    bad("sem sessão deveria retornar linked:false", JSON.stringify(anonRes));
  } else {
    ok("sem sessão → linked:false");
  }

  console.log("[isolation] user A (José)");
  const a = await callRpcAs(TEST_A);
  if (!a?.linked) bad("A não recebeu linked:true", JSON.stringify(a));
  else {
    if (a.customer?.id !== JOSE_ID) bad(`A viu customer ${a.customer?.id}, esperava ${JOSE_ID}`);
    else ok("A vê o próprio customer (José)");
    if (a.customer?.id === WELLINGTON_ID) bad("A viu Wellington — VAZAMENTO");
    if (a.founder?.number !== "002") bad(`A: founder esperado 002, recebeu ${a.founder?.number ?? "null"}`);
    else ok("A: founder Nº002 preservado");
    const plates = (a.vehicles ?? []).map((v) => v.plate);
    if (!plates.includes("EOA3940")) bad("A: veículo do José EOA3940 ausente");
    else ok("A: veículo EOA3940 presente");
    if (plates.some((p) => p === "SWR0J66" || p === "DEF8553")) bad("A: veículos do Wellington vazaram");
    else ok("A: nenhum veículo do Wellington");
    if (a.subscription?.plan !== "Smart") bad(`A: plano esperado Smart, recebeu ${a.subscription?.plan}`);
    else ok("A: plano Smart correto");
  }

  console.log("[isolation] user B (Wellington)");
  const b = await callRpcAs(TEST_B);
  if (!b?.linked) bad("B não recebeu linked:true", JSON.stringify(b));
  else {
    if (b.customer?.id !== WELLINGTON_ID) bad(`B viu customer ${b.customer?.id}, esperava ${WELLINGTON_ID}`);
    else ok("B vê o próprio customer (Wellington)");
    if (b.customer?.id === JOSE_ID) bad("B viu José — VAZAMENTO");
    if (b.founder) bad(`B não deveria ter founder, recebeu ${JSON.stringify(b.founder)}`);
    else ok("B: sem founder (correto)");
    const plates = (b.vehicles ?? []).map((v) => v.plate);
    if (!plates.includes("SWR0J66") || !plates.includes("DEF8553")) {
      bad(`B: esperava SWR0J66 + DEF8553, recebeu ${plates.join(",")}`);
    } else ok("B: veículos SWR0J66 + DEF8553 corretos");
    if (plates.some((p) => p === "EOA3940")) bad("B: veículo do José vazou");
    else ok("B: nenhum veículo do José");
    if (b.subscription?.plan !== "Priority") bad(`B: plano esperado Priority, recebeu ${b.subscription?.plan}`);
    else ok("B: plano Priority correto");
  }
} finally {
  if (cleanupNeeded) {
    console.log("[isolation] cleanup");
    await cleanupUser(userA);
    await cleanupUser(userB);
    ok("usuários e vínculos de teste removidos");
  }
}

if (process.exitCode === 1) {
  console.error("\n[isolation] FALHOU");
} else {
  console.log("\n[isolation] OK — isolamento cruzado comprovado");
}
