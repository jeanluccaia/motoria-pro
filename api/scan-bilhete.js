"use strict";

/**
 * POST /api/scan-bilhete
 * Body: { imageBase64: string (data URL or raw base64), mimeType: string }
 *
 * Sends image to Claude Vision, extracts bet slip data,
 * and returns a structured risk analysis with proprietary score.
 */

const { applyCors }           = require("./_cors");
const { getCodeSessionFromReq } = require("./_codeSession");

const AI_KEY = process.env.ANTHROPIC_API_KEY;

const ADMIN_KEYS = new Set(
  (process.env.ADMIN_KEYS || "").split(",").map(s => s.trim()).filter(Boolean)
);

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Max base64 size ~ 3 MB image → ~4 MB base64 (under Vercel 4.5 MB body limit)
const MAX_B64_LEN = 4.2 * 1024 * 1024;

const VISION_PROMPT = `Você é o motor de análise de risco proprietário do MotorIA Pro.

Analise esta imagem de bilhete de aposta e retorne APENAS JSON válido (sem markdown, sem blocos de código).

Estrutura obrigatória:
{
  "selecoes": [
    {
      "jogo": "Time A x Time B",
      "mercado": "Tipo de mercado (ex: Resultado, Ambos Marcam, +2.5 Gols, Handicap)",
      "escolha": "O que foi apostado (ex: Time A vence, Sim, Mais de 2.5)",
      "odd": 1.85,
      "riscoSelecao": 45
    }
  ],
  "oddTotal": 12.50,
  "valorApostado": 50.00,
  "numSelecoes": 5,
  "casa": "Nome da casa (Betano, Bet365, Sportingbet, etc)",
  "scoreRisco": 78,
  "scoreLabel": "ALTO",
  "veredicto": "EXIGE CAUTELA",
  "chanceImplicita": 8.0,
  "alertas": [
    { "tipo": "danger", "texto": "Alerta crítico específico para este bilhete" },
    { "tipo": "warn",   "texto": "Aviso de atenção relevante" },
    { "tipo": "info",   "texto": "Informação educativa importante" }
  ],
  "analise": "Duas frases diretas resumindo o principal risco desta múltipla."
}

Regras do scoreRisco (0–100):
- 0–35   → scoreLabel "BAIXO",    veredicto "CONTROLADO"
- 36–60  → scoreLabel "MODERADO", veredicto "ATENÇÃO"
- 61–80  → scoreLabel "ALTO",     veredicto "EXIGE CAUTELA"
- 81–100 → scoreLabel "CRÍTICO",  veredicto "ALTO RISCO"

Calcule o scoreRisco considerando:
1. Número de seleções — cada seleção adicional multiplica a variância
2. Probabilidade implícita — 1/oddTotal × 100 = % de chance estimada
3. Odds individuais altas (> 2.5) — indicam mercados instáveis
4. Mercados de alta variância — Primeiro Gol, Escanteios, Cartões, Handicap asiático
5. Correlação de favoritos — falsa sensação de segurança

O riscoSelecao de cada seleção deve seguir a mesma escala 0–100.
Gere entre 3 e 5 alertas específicos e relevantes para este bilhete.

Se a imagem NÃO for um bilhete de aposta, retorne apenas: {"erro": "Imagem não reconhecida como bilhete de aposta"}
Se não conseguir ler valores numéricos com clareza, use null nesses campos mas estime o score com base no que consegue ver.`;

function computeFallbackScore(selecoes, oddTotal) {
  const n = selecoes?.length || 1;
  const chance = oddTotal > 0 ? (1 / oddTotal) * 100 : 50;
  let score = Math.round(100 - chance);
  if (n > 4) score += (n - 4) * 3;
  if (n > 7) score += (n - 7) * 4;

  const highOdds = (selecoes || []).filter(s => (s.odd || 0) > 2.5).length;
  score += highOdds * 2;

  score = Math.max(10, Math.min(99, score));

  let scoreLabel, veredicto;
  if (score <= 35)      { scoreLabel = "BAIXO";    veredicto = "CONTROLADO";   }
  else if (score <= 60) { scoreLabel = "MODERADO"; veredicto = "ATENÇÃO";      }
  else if (score <= 80) { scoreLabel = "ALTO";     veredicto = "EXIGE CAUTELA";}
  else                  { scoreLabel = "CRÍTICO";  veredicto = "ALTO RISCO";   }

  return { scoreRisco: score, scoreLabel, veredicto };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  // ── Auth ────────────────────────────────────────────────────────
  const adminKey    = (req.headers["x-admin-key"] || "").trim();
  const isAdmin     = adminKey && ADMIN_KEYS.has(adminKey);
  const codeSession = getCodeSessionFromReq(req);

  if (!isAdmin && !codeSession?.email) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  if (!AI_KEY) {
    return res.status(503).json({ error: "Serviço de análise indisponível." });
  }

  // ── Body validation ─────────────────────────────────────────────
  const { imageBase64, mimeType = "image/jpeg" } = req.body || {};

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "Imagem não enviada." });
  }

  const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");

  if (base64Data.length > MAX_B64_LEN) {
    return res.status(413).json({ error: "Imagem muito grande. Use até 3 MB." });
  }

  const safeMime = ALLOWED_MIME.includes(mimeType) ? mimeType : "image/jpeg";

  // ── Claude Vision call ──────────────────────────────────────────
  let rawText = "";
  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         AI_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            {
              type:   "image",
              source: { type: "base64", media_type: safeMime, data: base64Data },
            },
            { type: "text", text: VISION_PROMPT },
          ],
        }],
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error("[scan-bilhete] Claude error", aiRes.status, errBody.slice(0, 300));
      return res.status(502).json({ error: "Falha ao processar imagem. Tente novamente." });
    }

    const aiData = await aiRes.json();
    rawText = aiData.content?.[0]?.text || "";

  } catch (fetchErr) {
    console.error("[scan-bilhete] fetch error:", fetchErr.message);
    return res.status(502).json({ error: "Falha de conexão com o motor de análise." });
  }

  // ── Parse JSON from AI response ─────────────────────────────────
  let parsed;
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON");
    parsed = JSON.parse(match[0]);
  } catch {
    console.error("[scan-bilhete] JSON parse fail. Raw:", rawText.slice(0, 400));
    return res.status(502).json({
      error: "Não foi possível interpretar o bilhete. Envie uma imagem mais nítida.",
    });
  }

  if (parsed.erro) {
    return res.status(422).json({ error: parsed.erro });
  }

  // ── Enrich with fallbacks if AI omitted fields ──────────────────
  if (!parsed.scoreRisco && parsed.oddTotal > 0) {
    Object.assign(parsed, computeFallbackScore(parsed.selecoes, parsed.oddTotal));
  }
  if (!parsed.scoreLabel && parsed.scoreRisco) {
    const s = parsed.scoreRisco;
    parsed.scoreLabel = s <= 35 ? "BAIXO" : s <= 60 ? "MODERADO" : s <= 80 ? "ALTO" : "CRÍTICO";
    parsed.veredicto  = s <= 35 ? "CONTROLADO" : s <= 60 ? "ATENÇÃO" : s <= 80 ? "EXIGE CAUTELA" : "ALTO RISCO";
  }
  if (parsed.chanceImplicita == null && parsed.oddTotal > 0) {
    parsed.chanceImplicita = parseFloat(((1 / parsed.oddTotal) * 100).toFixed(1));
  }
  if (!parsed.numSelecoes && parsed.selecoes?.length) {
    parsed.numSelecoes = parsed.selecoes.length;
  }

  console.log(
    `[scan-bilhete] OK email=${codeSession?.email || "admin"} ` +
    `score=${parsed.scoreRisco} sels=${parsed.numSelecoes} casa=${parsed.casa}`
  );

  return res.status(200).json({ ok: true, analise: parsed });
};
