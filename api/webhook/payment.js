const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const db     = require("../_db");

const AUTH_EMAIL_TTL_SECS = 86400 * 60; // 60 dias — janela generosa para o usuário fazer login

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Validate Kiwify signature
  const signature = req.headers["x-kiwify-signature"] || "";
  const secret    = process.env.KIWIFY_WEBHOOK_SECRET || "";

  if (secret) {
    const rawBody = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      console.warn("[webhook/payment] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const body    = req.body;
  const email   = body?.Customer?.email || body?.customer?.email || body?.email;
  const orderId = body?.order_id || body?.id;
  const status  = body?.order_status || body?.status || "";

  // Only process approved/completed payments
  const approvedStatuses = ["approved", "complete", "paid", "active"];
  if (status && !approvedStatuses.some((s) => status.toLowerCase().includes(s))) {
    return res.status(200).json({ received: true, ignored: true, reason: "non-payment status" });
  }

  if (!email) {
    console.warn("[webhook/payment] Missing email in payload");
    return res.status(400).json({ error: "Missing customer email" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[webhook/payment] Supabase env vars not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Find user by email using admin API
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("[webhook/payment] listUsers error:", usersErr.message);
    return res.status(500).json({ error: "Failed to look up user" });
  }

  const user = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  // ── Sempre: registrar autorização no Redis (funciona mesmo antes do cadastro) ──
  const normalizedEmail = email.toLowerCase();
  await db.set(`auth_email:${normalizedEmail}`, "1", AUTH_EMAIL_TTL_SECS);
  console.log(`[webhook/payment] auth_email gravado no Redis — email: ${normalizedEmail}`);

  if (!user) {
    // Usuário ainda não criou conta — autorização guardada no Redis.
    // Quando fizer login, /api/auth/sync-paid vai sincronizar is_paid.
    console.log(`[webhook/payment] Usuário não encontrado — aguarda primeiro login: ${normalizedEmail}`);
    return res.status(200).json({ received: true, note: "pending_first_login", email: normalizedEmail });
  }

  // Grant access in Supabase profiles
  const { error: updateErr } = await supabase
    .from("profiles")
    .upsert({
      id:         user.id,
      is_paid:    true,
      paid_at:    new Date().toISOString(),
      payment_id: orderId || null,
    }, { onConflict: "id" });

  if (updateErr) {
    console.error("[webhook/payment] update error:", updateErr.message);
    // Redis já foi salvo — não é erro fatal, sync-paid vai completar depois
  } else {
    // Redis já pode ser limpo (sincronizado com sucesso agora)
    await db.del(`auth_email:${normalizedEmail}`);
    console.log(`[webhook/payment] is_paid atualizado em Supabase — email: ${normalizedEmail}, uid: ${user.id}`);
  }

  return res.status(200).json({ success: true });
};
