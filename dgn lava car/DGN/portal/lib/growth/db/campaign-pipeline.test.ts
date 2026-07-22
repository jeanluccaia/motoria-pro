import assert from "node:assert/strict";
import test from "node:test";
import { countUniqueFunnel, rankContactsToday, validateStageChange, type PipelineMemberSummary } from "./campaign-pipeline.ts";

test("transições válidas seguem o funil", () => {
  assert.equal(validateStageChange("aguardando_analise", "pronto_para_contato").valid, true);
  assert.equal(validateStageChange("contato_preparado", "contatado").valid, true);
  assert.equal(validateStageChange("pagamento_enviado", "convertido").valid, true);
});
test("salto e retorno sem confirmação são inválidos", () => {
  assert.equal(validateStageChange("aguardando_analise", "convertido").valid, false);
  assert.equal(validateStageChange("contatado", "contato_preparado").valid, false);
});
test("retorno exige confirmação e motivo", () => assert.deepEqual(validateStageChange("contatado", "contato_preparado", { confirmBackward: true, reason: "Corrigir contato" }), { valid: true, backward: true }));
test("funil conta pessoas únicas e separa dimensões", () => {
  const a: PipelineMemberSummary = { customerId: "a", founderStatus: "confirmado", commercialStage: "convertido", kitStatus: "pendente" };
  const result = countUniqueFunnel([a, { ...a }, { ...a, customerId: "b", founderStatus: "selecionado", commercialStage: "conversando" }]);
  assert.deepEqual(result, { confirmed: 1, selected: 1, invited: 2, talking: 1, paymentSent: 0, converted: 1, waitingKit: 2, kitDelivered: 0, lost: 0 });
});
test("Quem contatar hoje prioriza vencido, hoje e score", () => {
  const rows: PipelineMemberSummary[] = [
    { customerId: "score", founderStatus: "recomendado", commercialStage: "aguardando_analise", kitStatus: "nao_aplicavel", score: 99 },
    { customerId: "today", founderStatus: "recomendado", commercialStage: "pronto_para_contato", kitStatus: "nao_aplicavel", nextActionAt: "2026-07-22T18:00:00Z" },
    { customerId: "late", founderStatus: "selecionado", commercialStage: "pronto_para_contato", kitStatus: "nao_aplicavel", nextActionAt: "2026-07-20T18:00:00Z" },
  ];
  assert.deepEqual(rankContactsToday(rows, new Date("2026-07-22T12:00:00-03:00")).map((row) => row.customerId), ["late", "today", "score"]);
});
