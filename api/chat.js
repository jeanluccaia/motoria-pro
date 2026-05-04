const SYSTEM_PROMPTS = require("./_prompts");

// ─── Whitelist de ferramentas permitidas ────────────────────────────────────
const ALLOWED_TOOLS = new Set(Object.keys(SYSTEM_PROMPTS));

// ─── Limites de segurança e custo ───────────────────────────────────────────
const MAX_INPUT_LENGTH = 2000;  // caracteres máximos por mensagem do usuário
const MAX_TOKENS = 2000;        // tokens máximos na resposta da API

// ─── Rate limit em memória (por instância serverless) ───────────────────────
// AVISO: em Vercel Functions, cada instância tem memória isolada.
// Para rate limiting robusto entre instâncias, configure Vercel KV (Redis).
// Este rate limit protege contra abuso dentro de cada instância.
const rateStore = new Map(); // ip -> { count, resetAt }
const RATE_WINDOW_MS = 60_000; // janela de 1 minuto
const RATE_MAX_REQUESTS = 8;   // máximo de requisições por minuto por IP

function isRateLimited(ip) {
  const now = Date.now();
  let entry = rateStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
  }

  entry.count += 1;
  rateStore.set(ip, entry);

  // Limpeza periódica para evitar vazamento de memória
  if (rateStore.size > 500) {
    for (const [k, v] of rateStore) {
      if (now >= v.resetAt) rateStore.delete(k);
    }
  }

  return entry.count > RATE_MAX_REQUESTS;
}

// ─── Handler principal ───────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // Verificar chave de API configurada (falha silenciosa — sem expor detalhes)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[chat] ANTHROPIC_API_KEY não configurada no ambiente.");
    return res.status(500).json({ error: "Serviço temporariamente indisponível." });
  }

  // Rate limit por IP
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Muitas requisições. Aguarde um momento e tente de novo." });
  }

  // Validar corpo da requisição
  const body = req.body || {};
  const { tool, userMessage } = body;

  if (!tool || typeof tool !== "string" || !ALLOWED_TOOLS.has(tool)) {
    return res.status(400).json({ error: "Ferramenta não reconhecida." });
  }

  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "Mensagem inválida." });
  }

  const trimmed = userMessage.trim();
  if (trimmed.length < 3 || trimmed.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: "Mensagem muito curta ou muito longa." });
  }

  // Chamar a API da Anthropic com o system prompt do servidor
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPTS[tool],
        messages: [{ role: "user", content: trimmed }],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      // Erros de autenticação e rate limit da Anthropic — sem expor detalhes
      if (status === 401 || status === 403) {
        console.error(`[chat] Erro de autenticação na API Anthropic: ${status}`);
        return res.status(500).json({ error: "Serviço temporariamente indisponível." });
      }
      if (status === 429) {
        return res.status(429).json({ error: "Serviço sobrecarregado. Tente em alguns segundos." });
      }
      console.error(`[chat] Erro na API Anthropic: ${status}`);
      return res.status(500).json({ error: "Erro ao processar. Tente novamente." });
    }

    const data = await response.json();

    return res.status(200).json({
      content: data.content || [],
    });
  } catch (err) {
    // Nunca expor detalhes internos de erro para o cliente
    console.error("[chat] Erro interno:", err.message);
    return res.status(500).json({ error: "Erro de conexão. Verifique sua internet e tente novamente." });
  }
};
