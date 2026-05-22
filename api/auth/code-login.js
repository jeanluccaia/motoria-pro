"use strict";

/**
 * POST /api/auth/code-login
 * Body: { email: string, code: string }
 *
 * MVP access flow: email + access code.
 * Valid codes are stored in public.access_codes when the table exists.
 * ACCESS_CODES and the beta codes below are a safe fallback during the MVP.
 */

const { createClient } = require("@supabase/supabase-js");
const db = require("../_db");
const { applyCors } = require("../_cors");
const { SESSION_DAYS, createCodeSession } = require("../_codeSession");

const RL_MAX = 10;
const RL_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_USES = 20;

function stripBOM(s) { return s && s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

const SB_URL = stripBOM(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const SB_SRV = stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY);

const TESTER_EMAILS = new Set(
  (process.env.TESTER_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
);

function normalizeCode(c) {
  return String(c || "")
    .trim()
    .toUpperCase()
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "");
}

const BETA_CODE_ROWS = [
  { code: "JEAN2026", maxUses: DEFAULT_MAX_USES, expiresAt: null },
  { code: "GELEIA2026", maxUses: DEFAULT_MAX_USES, expiresAt: null },
  { code: "TESTE2026", maxUses: DEFAULT_MAX_USES, expiresAt: null },
  { code: "PAULO2026", maxUses: DEFAULT_MAX_USES, expiresAt: null },
];

function parseEnvCodes() {
  const raw = process.env.ACCESS_CODES || "";
  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === "string") return { code: normalizeCode(item), maxUses: DEFAULT_MAX_USES };
        return {
          code: normalizeCode(item.code),
          maxUses: Number(item.max_uses || item.maxUses || DEFAULT_MAX_USES) || DEFAULT_MAX_USES,
          expiresAt: item.expires_at || item.expiresAt || null,
        };
      }).filter(x => x.code);
    }
  } catch {}

  return raw.split(",").map(part => {
    const [code, maxUses] = part.split(":");
    return {
      code: normalizeCode(code),
      maxUses: Number(maxUses || DEFAULT_MAX_USES) || DEFAULT_MAX_USES,
    };
  }).filter(x => x.code);
}

const ENV_CODE_ROWS = parseEnvCodes();
const FALLBACK_CODES = new Map(
  [...BETA_CODE_ROWS, ...ENV_CODE_ROWS].map(row => [row.code, { ...row, active: true }])
);

const memRL = new Map();

function normalizeEmail(e) { return String(e || "").trim().toLowerCase(); }
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function getClientIp(req) {
  // x-real-ip é injetado pelo Vercel e não pode ser spoofado pelo cliente
  const realIP = (req.headers["x-real-ip"] || "").trim();
  if (realIP) return realIP;
  // Último entry do x-forwarded-for (Vercel append ao final) — não o primeiro (controlado pelo cliente)
  const xff = (req.headers["x-forwarded-for"] || "").split(",");
  const edgeIP = xff[xff.length - 1]?.trim();
  if (edgeIP) return edgeIP;
  return req.socket?.remoteAddress || "unknown";
}

async function isRateLimited(ip) {
  const key = `rl:code:${ip}`;

  if (db.isConfigured()) {
    try {
      const count = await db.incrTTL(key, 60);
      if (count !== null) return count > RL_MAX;
    } catch {}
  }

  const now = Date.now();
  const slot = memRL.get(ip) || { count: 0, resetAt: now + RL_WINDOW_MS };

  if (now > slot.resetAt) {
    memRL.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }

  slot.count++;
  memRL.set(ip, slot);
  return slot.count > RL_MAX;
}

function supabaseAdmin() {
  if (!SB_URL || !SB_SRV) return null;
  return createClient(SB_URL, SB_SRV, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findOrCreateUser(admin, email) {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: "code_login" },
  });

  if (!createErr && created?.user) return created.user;

  let page = 1;
  while (true) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr || !list?.users) break;
    const found = list.users.find(u => normalizeEmail(u.email) === email);
    if (found) return found;
    if (!list.nextPage) break;
    page++;
  }

  return null;
}

async function ensureProfile(admin, user, email, source) {
  const full = {
    id: user.id,
    email,
    is_paid: true,
    paid_at: new Date().toISOString(),
    payment_id: source,
  };
  const { error } = await admin.from("profiles").upsert(full, { onConflict: "id" });
  if (error) {
    await admin.from("profiles").upsert({ id: user.id, email, is_paid: true }, { onConflict: "id" });
  }

  try {
    await admin.from("bankroll").upsert(
      { user_id: user.id, initial_balance: 0, current_balance: 0 },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  } catch {}
}

async function findActiveGrant(admin, email, code) {
  const { data, error } = await admin
    .from("access_grants")
    .select("id,user_id,email,code,status")
    .eq("email", email)
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();
  if (error) return { grant: null, tableMissing: isMissingTable(error) };
  return { grant: data || null, tableMissing: false };
}

function isMissingTable(error) {
  const msg = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("does not exist") || msg.includes("schema cache");
}

function isExpired(row) {
  return row?.expires_at && Date.now() >= new Date(row.expires_at).getTime();
}

async function getOrSeedAccessCode(admin, code) {
  const { data, error } = await admin
    .from("access_codes")
    .select("code,max_uses,used_count,active,expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) return { row: null, tableMissing: isMissingTable(error), error };
  if (data) return { row: data, tableMissing: false };

  const fallback = FALLBACK_CODES.get(code);
  if (!fallback) return { row: null, tableMissing: false };

  const seed = {
    code,
    max_uses: fallback.maxUses || DEFAULT_MAX_USES,
    used_count: 0,
    active: true,
    expires_at: fallback.expiresAt || null,
  };
  const { data: inserted, error: insertErr } = await admin
    .from("access_codes")
    .insert(seed)
    .select("code,max_uses,used_count,active,expires_at")
    .maybeSingle();

  if (insertErr) return { row: seed, tableMissing: false };
  return { row: inserted || seed, tableMissing: false };
}

async function recordGrant(admin, { email, user, code }) {
  const grant = {
    email,
    user_id: user.id,
    code,
    source: "code",
    status: "active",
    last_login_at: new Date().toISOString(),
  };

  const { error } = await admin.from("access_grants").insert(grant);
  if (!error) return { created: true, tableMissing: false };
  if (isMissingTable(error)) return { created: false, tableMissing: true };

  const { error: updateErr } = await admin
    .from("access_grants")
    .update({
      user_id: user.id,
      status: "active",
      last_login_at: grant.last_login_at,
    })
    .eq("email", email)
    .eq("code", code);

  return { created: false, tableMissing: isMissingTable(updateErr) };
}

async function consumeAccessCode(admin, row) {
  await admin
    .from("access_codes")
    .update({ used_count: Number(row.used_count || 0) + 1 })
    .eq("code", row.code);
}

async function validateWithRedisFallback(email, code) {
  let row = FALLBACK_CODES.get(code);
  if (!row && db.isConfigured()) {
    const dynamic = await db.get(`access_code:${code}`);
    if (dynamic?.code && dynamic?.active !== false) {
      row = {
        code: normalizeCode(dynamic.code),
        maxUses: Number(dynamic.max_uses || dynamic.maxUses || DEFAULT_MAX_USES) || DEFAULT_MAX_USES,
        expiresAt: dynamic.expires_at || dynamic.expiresAt || null,
        active: dynamic.active !== false,
      };
    }
  }
  if (!row) return { ok: false, reason: "invalid" };

  if (row.expiresAt && Date.now() >= new Date(row.expiresAt).getTime()) {
    return { ok: false, reason: "expired" };
  }

  if (!db.isConfigured()) {
    return { ok: true, existing: false, source: "env_no_counter" };
  }

  const key = `access_code_emails:${code}`;
  const already = await db.sismember(key, email);
  if (already) return { ok: true, existing: true, source: "redis" };

  const count = await db.scard(key);
  if (count !== null && count >= (row.maxUses || DEFAULT_MAX_USES)) {
    return { ok: false, reason: "limit" };
  }

  await db.sadd(key, email);
  return { ok: true, existing: false, source: "redis" };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const email = normalizeEmail(req.body?.email);
  const code = normalizeCode(req.body?.code ?? req.body?.accessCode ?? req.body?.token);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email invalido." });
  }
  if (!code) {
    return res.status(400).json({ error: "Informe o codigo de acesso." });
  }

  const ip = getClientIp(req);
  if (await isRateLimited(ip)) {
    return res.status(429).json({ error: "Muitas tentativas. Aguarde 1 minuto." });
  }

  const admin = supabaseAdmin();
  let existingGrant = null;
  let codeSource = "env";
  let shouldIncrement = false;

  if (admin) {
    const grantCheck = await findActiveGrant(admin, email, code);
    existingGrant = grantCheck.grant;

    const codeCheck = await getOrSeedAccessCode(admin, code);
    // Fall back to env/memory codes when: table missing, OR any Supabase error (e.g. BOM in key)
    const useFallback = codeCheck.tableMissing || (codeCheck.error && !codeCheck.row) || !codeCheck.row;
    if (useFallback) {
      const fallback = await validateWithRedisFallback(email, code);
      if (!fallback.ok) {
        const msg = fallback.reason === "limit"
          ? "Codigo atingiu o limite de usos."
          : "Codigo invalido ou expirado.";
        return res.status(fallback.reason === "limit" ? 403 : 401).json({ error: msg, code: fallback.reason });
      }
      codeSource = existingGrant ? "existing_grant" : fallback.source;
    } else {
      const row = codeCheck.row;
      if (!row || row.active === false || isExpired(row)) {
        return res.status(401).json({ error: "Codigo invalido ou expirado.", code: "invalid" });
      }
      if (!existingGrant && Number(row.used_count || 0) >= Number(row.max_uses || DEFAULT_MAX_USES)) {
        return res.status(403).json({ error: "Codigo atingiu o limite de usos.", code: "limit" });
      }
      codeSource = existingGrant ? "existing_grant" : "access_codes";
      shouldIncrement = !existingGrant;
      existingGrant = existingGrant || { __row: row };
    }
  } else {
    const fallback = await validateWithRedisFallback(email, code);
    if (!fallback.ok) {
      const msg = fallback.reason === "limit"
        ? "Codigo atingiu o limite de usos."
        : "Codigo invalido ou expirado.";
      return res.status(fallback.reason === "limit" ? 403 : 401).json({ error: msg, code: fallback.reason });
    }
    codeSource = fallback.source;
  }

  let user = null;
  if (admin) {
    user = await findOrCreateUser(admin, email);
    if (!user) return res.status(500).json({ error: "Falha ao liberar acesso." });

    await ensureProfile(admin, user, email, `code:${code}`);

    const grant = await recordGrant(admin, { email, user, code });
    if (shouldIncrement && existingGrant?.__row) {
      await consumeAccessCode(admin, existingGrant.__row);
    }

  }

  if (!user) {
    user = {
      id: `code:${Buffer.from(email).toString("base64url")}`,
      email,
    };
  }

  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const sessionToken = createCodeSession({ email, userId: user.id, code, expiresAt });

  console.log(`[code-login] acesso concedido email=${email} code=${code} source=${codeSource}`);

  return res.status(200).json({
    ok: true,
    email,
    code,
    expiresAt,
    via: "code",
    user: { id: user.id, email },
    sessionToken,
    grantStatus: "active",
  });
};
