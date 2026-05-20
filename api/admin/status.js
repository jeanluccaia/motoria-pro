/**
 * GET /api/admin/status
 * Header: x-admin-secret: ADMIN_SECRET
 * Query:  ?testEmail=user@example.com  (optional — tests authorization for that email)
 *
 * Diagnóstico completo de todas as integrações sem efeitos colaterais.
 */
"use strict";
const { createClient } = require("@supabase/supabase-js");
const { ALLOWED_ORIGINS } = require("../_cors");

const ADMIN_SECRET   = process.env.ADMIN_SECRET;
const SB_URL         = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SRV         = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY     = process.env.RESEND_API_KEY;
const RESEND_FROM    = process.env.RESEND_FROM;
const APP_URL        = process.env.APP_URL;
const WH_SECRET      = process.env.KIWIFY_WEBHOOK_SECRET;
const REDIS_URL      = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN    = process.env.UPSTASH_REDIS_REST_TOKEN;
const TESTER_EMAILS_RAW = process.env.TESTER_EMAILS || "";
const TESTER_EMAILS  = new Set(
  TESTER_EMAILS_RAW.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
);

function mask(v) {
  if (!v) return null;
  const s = String(v);
  return s.slice(0, 6) + "…" + s.slice(-4);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).end();

  if (!ADMIN_SECRET || req.headers["x-admin-secret"] !== ADMIN_SECRET)
    return res.status(401).json({ error: "Unauthorized" });

  const report = {
    timestamp: new Date().toISOString(),
    env: {
      VITE_SUPABASE_URL:         SB_URL    ? `✅ ${SB_URL}`          : "❌ AUSENTE",
      SUPABASE_SERVICE_ROLE_KEY: SB_SRV   ? `✅ ${mask(SB_SRV)}`    : "❌ AUSENTE — auth check vai falhar",
      RESEND_API_KEY:            RESEND_KEY? `✅ ${mask(RESEND_KEY)}` : "❌ AUSENTE",
      RESEND_FROM:               RESEND_FROM ? `✅ ${RESEND_FROM}`   : "❌ AUSENTE",
      APP_URL:                   APP_URL   ? `✅ ${APP_URL}`          : "❌ AUSENTE — redirectTo vai falhar",
      KIWIFY_WEBHOOK_SECRET:     WH_SECRET ? `✅ ${mask(WH_SECRET)}` : "⚠️  AUSENTE",
      ADMIN_SECRET:              "✅ configurado",
      UPSTASH_REDIS_REST_URL:    REDIS_URL ? `✅ ${mask(REDIS_URL)}` : "⚠️  AUSENTE (Redis opcional)",
      TESTER_EMAILS:             TESTER_EMAILS_RAW
        ? `✅ configurado (${TESTER_EMAILS.size} emails)`
        : "❌ AUSENTE — testers não têm acesso automático",
    },
    tester_config: {
      configured: Boolean(TESTER_EMAILS_RAW),
      count: TESTER_EMAILS.size,
    },
    cors: {
      allowed_origins: [...ALLOWED_ORIGINS],
      app_url: APP_URL || "❌ não configurado",
    },
    connectivity: {},
  };

  // ── Supabase ────────────────────────────────────────────────────────────────
  if (SB_URL && SB_SRV) {
    try {
      const sb = createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await sb.from("profiles").select("id").limit(1);
      if (error) {
        report.connectivity.supabase_profiles = `❌ ${error.message}`;
      } else {
        report.connectivity.supabase_profiles = `✅ profiles acessível (${data?.length ?? 0} rows retornados)`;
      }

      // Testar listUsers
      const { data: ud, error: ue } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
      report.connectivity.supabase_auth_admin = ue
        ? `❌ listUsers: ${ue.message}`
        : `✅ auth.admin OK (total users: ${ud?.total ?? "?"})`;

      // Verificar se profiles tem coluna is_paid
      const { data: pd, error: pe } = await sb.from("profiles").select("id, is_paid").limit(1);
      report.connectivity.supabase_profiles_schema = pe
        ? `❌ ${pe.message}`
        : `✅ colunas id + is_paid acessíveis`;

    } catch (e) {
      report.connectivity.supabase = `❌ exceção: ${e.message}`;
    }
  } else {
    report.connectivity.supabase = "❌ env vars ausentes — não testado";
  }

  // ── Resend ──────────────────────────────────────────────────────────────────
  if (RESEND_KEY) {
    try {
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${RESEND_KEY}` },
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        const domains = (d?.data || []).map(x => `${x.name} (${x.status})`).join(", ");
        report.connectivity.resend = `✅ API key válida | domínios: ${domains || "nenhum"}`;
      } else {
        report.connectivity.resend = `❌ API key inválida: ${d?.message || r.status}`;
      }
    } catch (e) {
      report.connectivity.resend = `❌ exceção: ${e.message}`;
    }
  } else {
    report.connectivity.resend = "❌ RESEND_API_KEY ausente";
  }

  // ── Redis ───────────────────────────────────────────────────────────────────
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const r = await fetch(REDIS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(["PING"]),
      });
      const d = await r.json().catch(() => ({}));
      report.connectivity.redis = r.ok && d?.result === "PONG"
        ? "✅ PONG recebido"
        : `❌ status ${r.status}: ${JSON.stringify(d)}`;
    } catch (e) {
      report.connectivity.redis = `❌ exceção: ${e.message}`;
    }
  } else {
    report.connectivity.redis = "⚠️  não configurado (opcional)";
  }

  // ── Webhook URL esperada ────────────────────────────────────────────────────
  const appBase = APP_URL || "https://motoria-pro.vercel.app";
  report.expected_webhook_url = WH_SECRET
    ? `${appBase}/api/webhook/payment?token=${WH_SECRET}`
    : `${appBase}/api/webhook/payment  (⚠️  sem autenticação — configure KIWIFY_WEBHOOK_SECRET)`;

  // ── testEmail: diagnóstico de autorização para um email específico ──────────
  const testEmail = String(req.query?.testEmail || "").trim().toLowerCase();
  if (testEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
    const result = { email: testEmail, checks: {} };

    result.checks.is_tester = TESTER_EMAILS.has(testEmail);

    if (SB_URL && SB_SRV) {
      try {
        const sb = createClient(SB_URL, SB_SRV, { auth: { autoRefreshToken: false, persistSession: false } });
        const { data: userList, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
          result.checks.auth_user = `❌ listUsers falhou: ${listErr.message}`;
        } else {
          const found = (userList?.users || []).find(u => (u.email || "").toLowerCase() === testEmail);
          if (!found) {
            result.checks.auth_user = `❌ não encontrado em auth.users (total: ${userList?.users?.length})`;
            result.checks.is_paid   = "❌ não verificado — usuário não existe";
          } else {
            result.checks.auth_user = `✅ encontrado uid=${found.id}`;
            const { data: prof, error: profErr } = await sb.from("profiles").select("is_paid, paid_at").eq("id", found.id).single();
            if (profErr) {
              result.checks.is_paid = `❌ profiles error: ${profErr.message}`;
            } else {
              result.checks.is_paid = prof?.is_paid === true
                ? `✅ is_paid=true (paid_at: ${prof.paid_at || "null"})`
                : `❌ is_paid=${prof?.is_paid}`;
            }
          }
        }
      } catch (e) {
        result.checks.auth_user = `❌ exceção: ${e.message}`;
      }
    } else {
      result.checks.auth_user = "❌ Supabase env vars ausentes";
    }

    result.conclusion = result.checks.is_tester
      ? "✅ AUTORIZADO via TESTER_EMAILS"
      : result.checks.is_paid?.startsWith("✅")
        ? "✅ AUTORIZADO via profiles.is_paid"
        : "❌ NEGADO — não é tester e is_paid != true";

    report.test_email_result = result;
  }

  return res.status(200).json(report);
};
