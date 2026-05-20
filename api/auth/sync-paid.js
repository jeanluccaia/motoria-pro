/**
 * POST /api/auth/sync-paid
 * Authorization: Bearer <supabase_jwt>
 *
 * Verifies the user's session and returns { is_paid: boolean }.
 * Uses anon-key JWT verification as fallback when service-role key is unavailable.
 *
 * Env:
 *   SUPABASE_SERVICE_ROLE_KEY  (optional, used for admin upserts)
 *   VITE_SUPABASE_URL          (required)
 *   VITE_SUPABASE_ANON_KEY     (required for fallback JWT verification)
 *   TESTER_EMAILS              (comma-separated always-authorized emails)
 *   UPSTASH_REDIS_REST_URL / TOKEN (optional)
 */
"use strict";

const { createClient } = require("@supabase/supabase-js");
const db = require("../_db");
const { applyCors } = require("../_cors");

const SB_URL  = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;

const TESTER_EMAILS = new Set(
  (process.env.TESTER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
);

// Verify JWT via Supabase Auth REST API using anon key (no service role needed)
// Safe fallback when SRK has encoding issues.
async function verifyJwtWithAnonKey(jwt) {
  if (!SB_URL || !SB_ANON) return null;
  try {
    const res = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "apikey": SB_ANON,
      },
    });
    if (!res.ok) {
      console.warn(`[sync-paid] anon verifyJwt HTTP ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("[sync-paid] anon verifyJwt threw:", err.message);
    return null;
  }
}

// Get profiles.is_paid via user-scoped client (anon key + user JWT → RLS lets user read own row)
async function getIsPaidUserScoped(userId, jwt) {
  if (!SB_URL || !SB_ANON) return false;
  try {
    const userSb = createClient(SB_URL, SB_ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth:   { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile } = await userSb
      .from("profiles")
      .select("is_paid")
      .eq("id", userId)
      .single();
    return profile?.is_paid === true;
  } catch (err) {
    console.error("[sync-paid] getIsPaidUserScoped threw:", err.message);
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return res.status(401).json({ error: "Token ausente." });

  if (!SB_URL) return res.status(500).json({ error: "Configuração do servidor incompleta." });

  // ── Step 1: verify JWT ──────────────────────────────────────────────────────
  let user = null;

  // Try service role first (full admin access)
  if (SB_SRV) {
    try {
      const admin = createClient(SB_URL, SB_SRV);
      const { data, error } = await admin.auth.getUser(jwt);
      if (!error && data?.user) {
        user = data.user;
      } else if (error) {
        console.warn("[sync-paid] admin.getUser error:", error.message);
      }
    } catch (err) {
      console.warn("[sync-paid] admin.getUser threw (SRK encoding issue?):", err.message.slice(0, 120));
    }
  }

  // Fallback: verify JWT via Supabase Auth API with anon key
  if (!user) {
    console.log("[sync-paid] falling back to anon JWT verification");
    user = await verifyJwtWithAnonKey(jwt);
  }

  if (!user?.id) {
    return res.status(401).json({ error: "Token inválido." });
  }

  const email = (user.email || "").toLowerCase();

  // ── Step 2: TESTER_EMAILS ──────────────────────────────────────────────────
  if (TESTER_EMAILS.has(email)) {
    console.log(`[sync-paid] tester autorizado: ${email}`);
    // Best-effort upsert — non-blocking, may fail if SRK is bad
    if (SB_SRV) {
      try {
        const admin = createClient(SB_URL, SB_SRV);
        await admin.from("profiles")
          .upsert({ id: user.id, is_paid: true }, { onConflict: "id" });
      } catch {}
    }
    return res.status(200).json({ is_paid: true });
  }

  // ── Step 3: Redis ──────────────────────────────────────────────────────────
  const redisKey = `auth_email:${email}`;
  let hasRedis = false;
  try {
    hasRedis = Boolean(await db.get(redisKey));
  } catch {}

  if (hasRedis) {
    if (SB_SRV) {
      try {
        const admin = createClient(SB_URL, SB_SRV);
        const { error: e1 } = await admin.from("profiles")
          .upsert({ id: user.id, is_paid: true, paid_at: new Date().toISOString() }, { onConflict: "id" });
        if (!e1) await db.del(redisKey);
        else console.warn("[sync-paid] redis upsert error:", e1.message);
      } catch {}
    }
    return res.status(200).json({ is_paid: true });
  }

  // ── Step 4: profiles.is_paid ──────────────────────────────────────────────
  if (SB_SRV) {
    try {
      const admin = createClient(SB_URL, SB_SRV);
      const { data: grant, error: grantErr } = await admin
        .from("access_grants")
        .select("id,status")
        .eq("email", email)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (!grantErr && grant?.id) {
        await admin.from("profiles")
          .upsert({ id: user.id, email, is_paid: true, paid_at: new Date().toISOString() }, { onConflict: "id" });
        return res.status(200).json({ is_paid: true });
      }
    } catch (err) {
      console.warn("[sync-paid] access_grants check skipped:", err.message.slice(0, 120));
    }
  }

  let isPaid = false;

  // Try admin client
  if (SB_SRV) {
    try {
      const admin = createClient(SB_URL, SB_SRV);
      const { data: profile, error: profErr } = await admin
        .from("profiles")
        .select("is_paid")
        .eq("id", user.id)
        .single();
      if (!profErr) {
        isPaid = profile?.is_paid === true;
        console.log(`[sync-paid] profiles (admin): is_paid=${isPaid} for ${email}`);
      } else {
        console.warn("[sync-paid] profiles admin error:", profErr.message);
      }
    } catch (err) {
      console.warn("[sync-paid] profiles admin threw:", err.message.slice(0, 120));
    }
  }

  // Fallback: user-scoped query (anon key + user JWT, RLS allows reading own row)
  if (!isPaid) {
    isPaid = await getIsPaidUserScoped(user.id, jwt);
    if (isPaid) console.log(`[sync-paid] profiles (user-scoped): is_paid=true for ${email}`);
  }

  return res.status(200).json({ is_paid: isPaid });
};
