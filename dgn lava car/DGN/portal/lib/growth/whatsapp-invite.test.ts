import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPortalWhatsAppInvite,
  DEFAULT_PORTAL_LOGIN_URL,
  PORTAL_INVITE_TEMPLATE_VERSION,
  WhatsAppInviteError,
} from "./whatsapp-invite.ts";

// -----------------------------------------------------------------------------
// Testes do helper PURO (sem I/O). Cobrem as garantias mais críticas da
// Fatia 2C que não dependem de banco:
//   * URL wa.me correta;
//   * telefone canônico BR aceito;
//   * telefone fora do padrão rejeitado;
//   * mensagem contém /entrar e o e-mail;
//   * URL usa encoding (não concatena texto cru);
//   * NENHUM token/JWT/customer_id na mensagem ou URL.
// -----------------------------------------------------------------------------

const canonicalPhone = "5519999999999"; // 55 + DDD 19 + celular 9 dígitos
const email = "cliente@teste.com";

test("gera URL wa.me correta com telefone e texto encoded", () => {
  const invite = buildPortalWhatsAppInvite({
    customerName: "Bruno Rossetti",
    normalizedPhone: canonicalPhone,
    email,
  });
  assert.ok(invite.url.startsWith(`https://wa.me/${canonicalPhone}?text=`), "URL deve começar com wa.me/{phone}?text=");
  assert.equal(invite.phoneE164, canonicalPhone);
  assert.equal(invite.destinationLast4, "9999");
  assert.equal(invite.portalLoginUrl, DEFAULT_PORTAL_LOGIN_URL);
  assert.equal(invite.templateVersion, PORTAL_INVITE_TEMPLATE_VERSION);
  assert.equal(invite.firstName, "Bruno");
});

test("aceita 12 dígitos (linha fixa 55 + DDD + 8 dígitos)", () => {
  const fixed = "551933334444";
  const invite = buildPortalWhatsAppInvite({
    customerName: "Cliente Fixo",
    normalizedPhone: fixed,
    email,
  });
  assert.equal(invite.phoneE164, fixed);
});

test("rejeita telefone fora do padrão 55 + 10/11 dígitos", () => {
  assert.throws(
    () => buildPortalWhatsAppInvite({ customerName: "X", normalizedPhone: "19999999999", email }),
    (err: unknown) => err instanceof WhatsAppInviteError && err.status === 400,
  );
  assert.throws(
    () => buildPortalWhatsAppInvite({ customerName: "X", normalizedPhone: "55", email }),
    (err: unknown) => err instanceof WhatsAppInviteError && err.status === 400,
  );
  assert.throws(
    () => buildPortalWhatsAppInvite({ customerName: "X", normalizedPhone: "abc", email }),
    (err: unknown) => err instanceof WhatsAppInviteError && err.status === 400,
  );
});

test("rejeita e-mail vazio", () => {
  assert.throws(
    () => buildPortalWhatsAppInvite({ customerName: "X", normalizedPhone: canonicalPhone, email: "" }),
    (err: unknown) => err instanceof WhatsAppInviteError && err.status === 400,
  );
});

test("rejeita portalLoginUrl não-HTTPS (defesa em profundidade)", () => {
  assert.throws(
    () => buildPortalWhatsAppInvite({
      customerName: "X",
      normalizedPhone: canonicalPhone,
      email,
      portalLoginUrl: "http://app.dgnclub.com/entrar",
    }),
    (err: unknown) => err instanceof WhatsAppInviteError && err.status === 400,
  );
});

test("mensagem contém a URL de login /entrar", () => {
  const invite = buildPortalWhatsAppInvite({
    customerName: "Bruno",
    normalizedPhone: canonicalPhone,
    email,
  });
  assert.ok(invite.message.includes("https://app.dgnclub.com/entrar"), "mensagem precisa conter /entrar");
});

test("mensagem contém o e-mail correto", () => {
  const invite = buildPortalWhatsAppInvite({
    customerName: "Bruno",
    normalizedPhone: canonicalPhone,
    email: "outro.cliente@empresa.com.br",
  });
  assert.ok(invite.message.includes("outro.cliente@empresa.com.br"), "mensagem precisa conter o e-mail");
});

test("URL usa encoding (nunca concatena texto cru)", () => {
  const invite = buildPortalWhatsAppInvite({
    customerName: "Bruno & Silva",
    normalizedPhone: canonicalPhone,
    email,
  });
  const suffix = invite.url.split("?text=")[1] ?? "";
  // Se o encoding estiver correto, a URL depois de ?text= não contém:
  //   * newline literal (deve virar %0A);
  //   * espaço literal (deve virar %20 ou +);
  //   * caractere '&' cru (poderia colidir com query string).
  assert.ok(!suffix.includes("\n"), "encoding falhou: newline cru");
  assert.ok(!/ /.test(suffix), "encoding falhou: espaço cru");
  // A mensagem contém '&' via "Bruno & Silva" → deve virar %26 na URL.
  assert.ok(suffix.includes("%26") || !invite.message.includes("&"), "encoding de & falhou");
  // decodeURIComponent do texto deve reconstituir a mensagem original.
  assert.equal(decodeURIComponent(suffix), invite.message);
});

test("NUNCA embute token/JWT/UUID/customer_id/segredo na URL ou na mensagem", () => {
  const invite = buildPortalWhatsAppInvite({
    customerName: "Bruno Rossetti",
    normalizedPhone: canonicalPhone,
    email,
  });
  // Padrões que jamais devem aparecer:
  //   * JWT (3 blocos base64 separados por '.'): xxx.yyy.zzz.
  //   * UUID v4: 8-4-4-4-12 hex.
  //   * palavras-chave típicas de segredo.
  const forbiddenPatterns = [
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, // JWT
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUID
    /token=/i,
    /secret/i,
    /jwt/i,
    /service[_-]?role/i,
    /magic[_-]?link/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(invite.url), `URL contém padrão proibido: ${pattern}`);
    assert.ok(!pattern.test(invite.message), `mensagem contém padrão proibido: ${pattern}`);
  }
});

test("firstName cai em fallback 'assinante' quando nome está vazio ou nulo", () => {
  const invA = buildPortalWhatsAppInvite({ customerName: null, normalizedPhone: canonicalPhone, email });
  assert.equal(invA.firstName, "assinante");
  const invB = buildPortalWhatsAppInvite({ customerName: "   ", normalizedPhone: canonicalPhone, email });
  assert.equal(invB.firstName, "assinante");
  const invC = buildPortalWhatsAppInvite({ customerName: "  Bruno  Rossetti  ", normalizedPhone: canonicalPhone, email });
  assert.equal(invC.firstName, "Bruno");
});
