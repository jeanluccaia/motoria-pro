/**
 * _email.js — Envio de email transacional via Resend REST API
 *
 * Usa fetch nativo (Node 18+). Zero dependências externas.
 *
 * Variáveis de ambiente necessárias:
 *   RESEND_API_KEY  — API key do Resend (resend.com)
 *   RESEND_FROM     — Remetente verificado, ex: "MotorIA <acesso@motoriaopro.com.br>"
 *   APP_URL         — URL base do app, ex: "https://motoriaopro.com.br"
 */

"use strict";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM    = process.env.RESEND_FROM || "MotorIA <acesso@motoriaopro.com.br>";
const APP_URL        = (process.env.APP_URL || "https://motoriaopro.com.br").replace(/\/$/, "");

/**
 * Envia o email de acesso ao comprador.
 * Retorna { ok: true } ou { ok: false, error: string }.
 */
async function sendAccessEmail({ to, token, name = "" }) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY não configurada — email não enviado.");
    return { ok: false, error: "RESEND_API_KEY não configurada." };
  }
  if (!to || !token) {
    return { ok: false, error: "Parâmetros insuficientes (to, token)." };
  }

  const accessUrl = `${APP_URL}/app?t=${token}`;
  const html      = buildEmailHtml({ name, accessUrl });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    RESEND_FROM,
        to:      [to],
        subject: "Seu acesso ao MotorIA Risk Engine™",
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || data?.name || `HTTP ${res.status}`;
      console.error(`[email] Resend erro — to: ${to}, status: ${res.status}, msg: ${msg}`);
      return { ok: false, error: msg };
    }

    console.log(`[email] Email enviado — to: ${to}, resend_id: ${data.id}`);
    return { ok: true, id: data.id };

  } catch (err) {
    console.error("[email] Fetch error:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Template HTML do email de acesso.
 * Dark, premium, minimalista. Compatível com Gmail, Outlook, Apple Mail.
 */
function buildEmailHtml({ name, accessUrl }) {
  const greeting = name ? `Olá${name ? ", " + name.split(" ")[0] : ""}.` : "Olá.";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<title>Seu acesso ao MotorIA Risk Engine™</title>
<style>
  @media (prefers-color-scheme: dark) {
    .email-bg { background-color: #060608 !important; }
    .email-card { background-color: #0B0B0F !important; border-color: rgba(255,255,255,0.07) !important; }
    .email-text { color: #DDDDE0 !important; }
    .email-muted { color: #72727A !important; }
    .email-divider { border-color: rgba(255,255,255,0.07) !important; }
  }
  @media only screen and (max-width: 600px) {
    .email-card { border-radius: 0 !important; padding: 32px 24px !important; }
    .email-btn { display: block !important; text-align: center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#060608;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">

  <table class="email-bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060608;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table class="email-card" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;background-color:#0B0B0F;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:44px 40px;">
          <tr>
            <td>

              <!-- Logo / brand -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px;height:28px;background-color:#22C55E;border-radius:6px;text-align:center;vertical-align:middle;">
                          <span style="font-size:13px;font-weight:900;color:#050507;line-height:28px;">M</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:14px;font-weight:800;color:#DDDDE0;letter-spacing:-0.03em;">MotorIA</span>
                          <span style="font-size:14px;color:rgba(255,255,255,0.2);margin:0 5px;">·</span>
                          <span style="font-size:11px;font-weight:600;color:#38383E;letter-spacing:0.04em;">Risk Engine™</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Eyebrow -->
              <p style="margin:0 0 14px;font-size:9px;font-weight:800;letter-spacing:0.18em;color:#22C55E;text-transform:uppercase;">
                ACESSO LIBERADO
              </p>

              <!-- Headline -->
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:900;color:#DDDDE0;letter-spacing:-0.04em;line-height:1.15;">
                ${greeting}<br />
                Seu acesso está<br />ativo.
              </h1>

              <!-- Body text -->
              <p class="email-text" style="margin:0 0 32px;font-size:15px;color:#72727A;line-height:1.75;">
                O MotorIA Risk Engine™ está pronto para uso imediato.
                Clique no botão abaixo para acessar a plataforma e iniciar
                sua primeira análise quantitativa.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                <tr>
                  <td>
                    <a class="email-btn" href="${accessUrl}"
                      style="display:inline-block;background-color:#DDDDE0;color:#060608;font-size:12px;font-weight:900;letter-spacing:0.14em;text-decoration:none;padding:15px 28px;border-radius:8px;text-transform:uppercase;">
                      Acessar Plataforma &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td class="email-divider" style="height:1px;background-color:rgba(255,255,255,0.07);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Info rows -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:11px;color:#38383E;font-weight:700;letter-spacing:0.06em;">PRODUTO</td>
                        <td align="right" style="font-size:11px;color:#72727A;">MotorIA Risk Engine™ v2.4</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:11px;color:#38383E;font-weight:700;letter-spacing:0.06em;">ACESSO</td>
                        <td align="right" style="font-size:11px;color:#72727A;">Imediato · 1 ano</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:11px;color:#38383E;font-weight:700;letter-spacing:0.06em;">SUPORTE</td>
                        <td align="right" style="font-size:11px;color:#72727A;">suporte@motoriaopro.com.br</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin:0 0 24px;font-size:11px;color:#38383E;line-height:1.7;">
                Se o botão não funcionar, copie e cole este link no navegador:<br />
                <a href="${accessUrl}" style="color:#22C55E;text-decoration:none;word-break:break-all;font-family:'Courier New',monospace;font-size:10px;">${accessUrl}</a>
              </p>

              <!-- Disclaimer -->
              <p style="margin:0;font-size:10px;color:#38383E;line-height:1.65;">
                Ferramenta educativa · Não constitui recomendação de aposta ·
                Não compartilhe este link · Garantia de 7 dias
              </p>

            </td>
          </tr>
        </table>
        <!-- /Card -->

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;padding:20px 0 0;">
          <tr>
            <td align="center" style="font-size:10px;color:#38383E;line-height:1.65;">
              MotorIA Risk Engine™ · motoriaopro.com.br<br />
              Você recebeu este email pois realizou uma compra.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

module.exports = { sendAccessEmail };
