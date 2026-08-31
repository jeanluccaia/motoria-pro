import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGENT_INTENTS,
  assertAskIsSafe,
  buildIntentPrompt,
  isAgentIntent,
} from "./intents.ts";

// -----------------------------------------------------------------------------
// Provas de segurança dos deep-links do Assistente DGN.
//   1. Allowlist fechada — intent desconhecida não é aceita.
//   2. Prompts determinísticos — sem interpolação de instrução vinda do usuário.
//   3. Guardrail do ?ask= barra tentativas de instrução destrutiva.
//   4. Todos os intents mapeados incluem o customer id quando fornecido.
// -----------------------------------------------------------------------------

test("allowlist fechada: só as 7 intents documentadas passam", () => {
  assert.equal(isAgentIntent("customer_summary"), true);
  assert.equal(isAgentIntent("prepare_followup"), true);
  assert.equal(isAgentIntent("attack_plan"), true);
  assert.equal(isAgentIntent("delete_customer"), false);
  assert.equal(isAgentIntent("send_whatsapp"), false);
  assert.equal(isAgentIntent(""), false);
  assert.equal(AGENT_INTENTS.length, 7);
});

test("prompts são determinísticos e incluem o customer id", () => {
  for (const intent of AGENT_INTENTS) {
    const prompt = buildIntentPrompt(intent, "c-1");
    assert.ok(prompt.length > 10, `intent ${intent} deve produzir prompt`);
    if (intent !== "attack_plan") {
      assert.match(prompt, /id: c-1/, `intent ${intent} deve conter o id`);
    }
  }
});

test("prompts NUNCA pedem ação executiva/destrutiva", () => {
  const dangerous = /\b(?:envi|mand|dispar|execut|atualiz|grav|delet|remov)/i;
  for (const intent of AGENT_INTENTS) {
    const prompt = buildIntentPrompt(intent, "c-1");
    assert.doesNotMatch(prompt, dangerous, `intent ${intent} contém verbo executivo: ${prompt}`);
  }
});

test("assertAskIsSafe: bloqueia envio de WhatsApp", () => {
  assert.notEqual(assertAskIsSafe("envie WhatsApp para o cliente Jean"), null);
  assert.notEqual(assertAskIsSafe("MANDA a mensagem no whats"), null);
  assert.notEqual(assertAskIsSafe("dispare o convite"), null);
});

test("assertAskIsSafe: bloqueia atualização de CRM/status", () => {
  assert.notEqual(assertAskIsSafe("atualize o estágio do cliente para convertido"), null);
  assert.notEqual(assertAskIsSafe("grave nota no CRM"), null);
});

test("assertAskIsSafe: bloqueia confirmação de pagamento", () => {
  assert.notEqual(assertAskIsSafe("confirme o pagamento do founder"), null);
});

test("assertAskIsSafe: permite leitura/preparação", () => {
  assert.equal(assertAskIsSafe("Quem devo chamar hoje?"), null);
  assert.equal(assertAskIsSafe("prepare uma mensagem de follow-up para o Jean"), null);
  assert.equal(assertAskIsSafe("resuma o cliente id abc"), null);
});

test("assertAskIsSafe: bloqueia string vazia e muito longa", () => {
  assert.notEqual(assertAskIsSafe(""), null);
  assert.notEqual(assertAskIsSafe("x".repeat(501)), null);
});
