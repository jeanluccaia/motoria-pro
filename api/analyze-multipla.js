const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { selecoes = [], valorTotal, oddTotal, chanceReal } = req.body;

  // Verificar acesso via Supabase JWT ou admin bypass
  let isPaid = false;
  const authHeader = req.headers.authorization || "";
  const jwt        = authHeader.replace("Bearer ", "");
  const adminKey   = (req.headers["x-admin-key"] || "").trim();

  const ADMIN_KEYS = new Set(["MOTORIA_OWNER_KEY_2026", "MOTORIA_ADMIN_2026"]);
  if (ADMIN_KEYS.has(adminKey)) isPaid = true;

  if (jwt && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: { user } } = await supabase.auth.getUser(jwt);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("is_paid").eq("id", user.id).single();
        isPaid = profile?.is_paid === true;
      }
    } catch (_) {}
  }

  const nivelRisco =
    chanceReal > 40 ? "baixo" :
    chanceReal > 20 ? "médio" :
    chanceReal > 10 ? "alto"  : "muito alto";

  // Resultado parcial para não-pagantes
  if (!isPaid) {
    return res.status(200).json({
      isPaid: false,
      nivelRisco,
      mensagem: "Risco identificado no bilhete.",
      alertas: [
        `${selecoes.length} seleções combinadas`,
        "Odd total e chance real ocultos",
        "Análise completa disponível no plano pago",
      ],
    });
  }

  // Percentual da banca (se informado)
  let percentualBanca = null;
  if (valorTotal && jwt) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: { user } } = await supabase.auth.getUser(jwt);
      if (user) {
        const { data: banca } = await supabase
          .from("banca").select("saldo_atual").eq("user_id", user.id).single();
        if (banca?.saldo_atual > 0) {
          percentualBanca = ((parseFloat(valorTotal) / banca.saldo_atual) * 100).toFixed(1);
        }
      }
    } catch (_) {}
  }

  const mensagem =
    chanceReal < 15
      ? `Esse bilhete tem apenas ${chanceReal.toFixed(1)}% de chance matemática. Cada seleção errada derruba tudo.`
      : chanceReal < 30
      ? `Chance real de ${chanceReal.toFixed(1)}%. O risco aumentou combinando ${selecoes.length} seleções.`
      : `Bilhete com ${chanceReal.toFixed(1)}% de chance. Risco ${nivelRisco} para essa construção.`;

  const alertaBanca =
    percentualBanca && parseFloat(percentualBanca) > 5
      ? `Você está colocando ${percentualBanca}% da sua banca nessa múltipla. Considere reduzir.`
      : null;

  return res.status(200).json({
    isPaid: true,
    nivelRisco,
    chanceReal: chanceReal.toFixed(1),
    oddTotal: oddTotal.toFixed(2),
    percentualBanca,
    mensagem,
    alertaBanca,
    explicacao: `Para esse bilhete bater, ${selecoes.length} eventos precisam acontecer certos ao mesmo tempo.`,
  });
};
