/**
 * Regressão P0 — WhatsApp DGN.
 *
 * Incidente: o número 551938826936 estava hardcoded como fallback em
 * app/agendar/page.tsx e o WhatsApp devolvia "not on WhatsApp". Este teste
 * trava a constante canônica e garante que nenhuma URL gerada aqui aponta
 * para o número quebrado.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { WHATSAPP_DGN, urls, whatsappAtendimento } from "./config.ts";

const CANONICAL = "5519978146936";
const BROKEN = "551938826936";

test("WHATSAPP_DGN é a constante canônica 5519978146936", () => {
  assert.equal(WHATSAPP_DGN, CANONICAL);
});

test("nenhuma URL gerada em lib/config contém o número quebrado", () => {
  for (const [name, url] of Object.entries(urls)) {
    assert.ok(!url.includes(BROKEN), `urls.${name} ainda aponta pro número quebrado: ${url}`);
    assert.ok(url.includes(CANONICAL), `urls.${name} não usa canônico: ${url}`);
  }
  const wa = whatsappAtendimento(false);
  const waFounder = whatsappAtendimento(true);
  assert.ok(!wa.includes(BROKEN));
  assert.ok(!waFounder.includes(BROKEN));
  assert.ok(wa.includes(CANONICAL));
  assert.ok(waFounder.includes(CANONICAL));
});

test("URL wa.me está bem-formada (encoded, wa.me/{num}?text=...)", () => {
  const wa = whatsappAtendimento(false);
  assert.match(wa, /^https:\/\/wa\.me\/5519978146936\?text=.+/);
  // Texto pré-preenchido tem que estar URL-encoded (sem espaços literais).
  const query = wa.split("?text=")[1] ?? "";
  assert.ok(!query.includes(" "), "texto do WhatsApp não deve conter espaço literal");
  assert.ok(query.length > 0, "texto do WhatsApp não deve ser vazio");
});
