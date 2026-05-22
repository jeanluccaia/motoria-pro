"use strict";

/**
 * POST /api/analyze-multipla
 * Body: { selecoes, valorTotal, oddTotal, chanceReal, bancaAtual? }
 *
 * Auth: admin key OR Supabase JWT (with anon-key fallback, no SRK needed).
 * Analysis: mathematical + AI risk narrative for the full ticket.
 */

const { createClient } = require("@supabase/supabase-js");
const { applyCors }   = require("./_cors");
const { getCodeSessionFromReq } = require("./_codeSession");

const SB_URL  = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_SRV  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_KEY  = process.env.ANTHROPIC_API_KEY;

const TESTER_EMAILS = new Set(
  (process.env.TESTER_EMAILS || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
);

const ADMIN_KEYS = new Set(
  (process.env.ADMIN_KEYS || "").split(",").map(s => s.trim()).filter(Boolean)
);

// ── Auth ────────────────────────────────────────────────────────────────────

async function verifyJWT(jwt) {
  if (!jwt || jwt === "local-dev-bypass") return null;

  // Try admin client first
  if (SB_URL && SB_SRV) {
    try {
      const admin = createClient(SB_URL, SB_SRV);
      const { data: { user } } = await admin.auth.getUser(jwt);
      if (user) return user;
    } catch {}
  }

  // Fallback: anon key (no SRK needed — avoids encoding issues)
  if (SB_URL && SB_ANON) {
    try {
      const r = await fetch(`${SB_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${jwt}`, apikey: SB_ANON },
      });
      if (r.ok) return await r.json();
    } catch {}
  }
  return null;
}

async function getIsPaid(userId, jwt) {
  // Try admin client
  if (SB_URL && SB_SRV) {
    try {
      const admin = createClient(SB_URL, SB_SRV);
      const { data } = await admin.from("profiles").select("is_paid").eq("id", userId).single();
      if (data) return data.is_paid === true;
    } catch {}
  }

  // Fallback: user-scoped client
  if (SB_URL && SB_ANON) {
    try {
      const userSb = createClient(SB_URL, SB_ANON, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await userSb.from("profiles").select("is_paid").eq("id", userId).single();
      return data?.is_paid === true;
    } catch {}
  }
  return false;
}

// ── AI ──────────────────────────────────────────────────────────────────────

async function callAI(selecoes, chanceReal, oddTotal, valorTotal, bancaAtual) {
  if (!AI_KEY) return null;

  const pct = bancaAtual > 0 ? ((valorTotal / bancaAtual) * 100).toFixed(1) : null;
  const retorno = (valorTotal * oddTotal).toFixed(2);

  const prompt = `Você é um analista sênior de gestão de risco em apostas esportivas. Analise este bilhete múltiplo de forma técnica e direta.

BILHETE:
${selecoes.map((s, i) => `${i + 1}. ${s.jogo} | ${s.mercado} | Odd ${parseFloat(s.odd).toFixed(2)}${s.obs ? ` | Obs: ${s.obs}` : ""}`).join("\n")}

DADOS DO BILHETE:
- Seleções: ${selecoes.length}
- Odd total: ${parseFloat(oddTotal).toFixed(2)}
- Chance estimada: ${parseFloat(chanceReal).toFixed(1)}%
- Valor da aposta: R$${valorTotal || "não informado"}
- Retorno possível: R$${retorno}
${pct ? `- Percentual da banca: ${pct}%` : ""}

Regras absolutas:
- NUNCA transforme a análise em comando de decisão
- NUNCA invente estatísticas específicas
- Use linguagem popular, direta e fácil de entender

Responda EXATAMENTE neste formato (sem texto extra antes ou depois):

NIVEL_RISCO: [baixo | médio | alto | muito alto]
DEPENDENCIAS: [frase curta e simples descrevendo o que precisa bater no bilhete — ex: "3 resultados precisam dar certo juntos"]
RISCO_PRINCIPAL: [1-2 frases sobre o maior risco deste bilhete específico]
O_QUE_PODE_DAR_ERRADO:
- [primeiro fator concreto de risco]
- [segundo fator]
- [terceiro fator]
ALERTA_ACUMULADO: [frase sobre como o risco cresce com cada seleção adicionada — use % se possível]
LEITURA_FINAL: [avaliação técnica do bilhete como um todo — 2-3 frases]`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": AI_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    return d?.content?.[0]?.text || null;
  } catch (e) {
    console.error("[analyze-multipla] AI error:", e.message);
    return null;
  }
}

function parseAI(text) {
  if (!text) return {};
  function line(key) {
    const m = text.match(new RegExp(`^${key}:\\s*(.+)`, "m"));
    return m ? m[1].trim() : null;
  }
  function block(key) {
    const m = text.match(new RegExp(`^${key}:[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z_]{3,}:|$)`, "m"));
    return m ? m[1].trim() : line(key);
  }
  const erradoRaw = block("O_QUE_PODE_DAR_ERRADO") || "";
  const errado = erradoRaw
    .split("\n")
    .map(l => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  return {
    nivelRisco:      line("NIVEL_RISCO"),
    dependencias:    line("DEPENDENCIAS"),
    riscoPrincipal:  line("RISCO_PRINCIPAL"),
    errado,
    alertaAcumulado: line("ALERTA_ACUMULADO"),
    leituraFinal:    line("LEITURA_FINAL"),
  };
}

// ── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { selecoes = [], valorTotal, oddTotal, chanceReal, bancaAtual } = req.body;

  if (!Array.isArray(selecoes) || selecoes.length < 2) {
    return res.status(400).json({ error: "Adicione pelo menos 2 seleções." });
  }

  // ── Auth check ─────────────────────────────────────────────────────────────
  const adminKey = (req.headers["x-admin-key"] || "").trim();
  let isPaid = ADMIN_KEYS.size > 0 && ADMIN_KEYS.has(adminKey);

  if (!isPaid && getCodeSessionFromReq(req)) {
    isPaid = true;
  }

  const jwt = (req.headers.authorization || "").replace("Bearer ", "").trim();

  if (!isPaid && jwt) {
    const user = await verifyJWT(jwt);
    if (user) {
      if (TESTER_EMAILS.has((user.email || "").toLowerCase())) {
        isPaid = true;
      } else {
        isPaid = await getIsPaid(user.id, jwt);
      }
    }
  }

  // ── Math ────────────────────────────────────────────────────────────────────
  const oddN   = parseFloat(oddTotal) || selecoes.reduce((a, s) => a * parseFloat(s.odd), 1);
  const chance = parseFloat(chanceReal) || (1 / oddN) * 100;
  const valor  = parseFloat(valorTotal) || 0;
  const banca  = parseFloat(bancaAtual) || 0;

  const nivelRisco =
    chance > 40 ? "baixo"     :
    chance > 20 ? "médio"     :
    chance > 10 ? "alto"      : "muito alto";

  const percentualBanca = banca > 0 ? ((valor / banca) * 100).toFixed(1) : null;
  const retornoPossivel = valor > 0 ? (valor * oddN).toFixed(2) : null;

  // ── Partial result for non-paid ────────────────────────────────────────────
  if (!isPaid) {
    return res.status(200).json({
      isPaid: false,
      nivelRisco,
      mensagem: `${selecoes.length} seleções no bilhete. Risco acumulado identificado.`,
      alertas: [
        `${selecoes.length} coisas precisam dar certo juntas`,
        "Uma seleção pode parecer simples sozinha. O risco muda quando você junta várias no mesmo bilhete.",
        "Análise completa de risco bloqueada",
      ],
    });
  }

  // ── AI analysis ────────────────────────────────────────────────────────────
  const aiText = await callAI(selecoes, chance, oddN, valor, banca);
  const ai     = parseAI(aiText);

  const riskLevel = ai.nivelRisco || nivelRisco;

  const mensagem =
    chance < 15
      ? `${chance.toFixed(1)}% de chance estimada. Uma única falha encerra o bilhete.`
      : chance < 30
      ? `${chance.toFixed(1)}% de chance estimada. Com ${selecoes.length} seleções, tudo precisa bater junto.`
      : `${chance.toFixed(1)}% de chance estimada para este bilhete de ${selecoes.length} seleções.`;

  const alertaBanca =
    percentualBanca && parseFloat(percentualBanca) > 5
      ? `${percentualBanca}% da sua banca nessa múltipla — valor alto para uma aposta só.`
      : percentualBanca && parseFloat(percentualBanca) > 2
      ? `${percentualBanca}% da banca em jogo. Vale olhar o impacto no longo prazo.`
      : null;

  return res.status(200).json({
    isPaid: true,
    nivelRisco:       riskLevel,
    chanceReal:       chance.toFixed(1),
    oddTotal:         oddN.toFixed(2),
    percentualBanca,
    retornoPossivel,
    mensagem,
    alertaBanca,

    // AI fields
    dependencias:    ai.dependencias    || `${selecoes.length} resultados independentes precisam ocorrer ao mesmo tempo.`,
    riscoPrincipal:  ai.riscoPrincipal  || null,
    errado:          ai.errado          || [],
    alertaAcumulado: ai.alertaAcumulado || "Quanto mais seleções, maior o risco acumulado.",
    leituraFinal:    ai.leituraFinal    || null,
  });
};
