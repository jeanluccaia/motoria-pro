import { test, expect } from "@playwright/test";
import {
  normalizeName,
  tokensOf,
  matchAliases,
  parseCampaignUnit,
  type ParsedAlias,
} from "../src/lib/integrations/utmify/parser";

const aliases: ParsedAlias[] = [
  { alias: "IPIRANGA", unitId: "u-ipiranga" },
  { alias: "TOUR IPIRANGA", unitId: "u-ipiranga" },
  { alias: "AMOREIRAS", unitId: "u-amoreiras" },
  { alias: "MOGI MIRIM", unitId: "u-mogi" },
  { alias: "MOGI", unitId: "u-mogi" },
  { alias: "VILA INDUSTRIAL", unitId: "u-vila" },
  { alias: "VILA", unitId: "u-vila" },
  { alias: "CARREFOUR VALINHOS", unitId: "u-carrefour" },
  { alias: "CARREFOUR", unitId: "u-carrefour" },
];

test.describe("Parser de nomenclatura", () => {
  test("normaliza caixa, acentos, separadores", () => {
    // "Vêndas" e "Ipirãnga" (com acentos plantados) devem virar formas ASCII.
    expect(normalizeName("LF | Vêndas | Ipirãnga | ago26")).toBe(
      "LF VENDAS IPIRANGA AGO26",
    );
    expect(normalizeName("VI_TOTALPASS")).toBe("VI TOTALPASS");
    expect(normalizeName("  ")).toBe("");
  });

  test("tokensOf devolve palavras", () => {
    expect(tokensOf("LF | VENDAS | IPIRANGA | POWER PLUS | AGO26")).toEqual([
      "LF",
      "VENDAS",
      "IPIRANGA",
      "POWER",
      "PLUS",
      "AGO26",
    ]);
  });

  test("padrão canônico: LF | VENDAS | IPIRANGA | POWER PLUS | AGO26", () => {
    const out = parseCampaignUnit("LF | VENDAS | IPIRANGA | POWER PLUS | AGO26", aliases);
    expect(out.source).toBe("auto");
    if (out.source === "auto") expect(out.unitId).toBe("u-ipiranga");
  });

  test("nomenclatura invertida: LF | IPIRANGA | WHATSAPP | AGO26 Campanha", () => {
    const out = parseCampaignUnit("LF | IPIRANGA | WHATSAPP | AGO26 Campanha", aliases);
    expect(out.source).toBe("auto");
    if (out.source === "auto") expect(out.unitId).toBe("u-ipiranga");
  });

  test("alias multi-palavra vence alias mais curto (CARREFOUR VALINHOS)", () => {
    const out = parseCampaignUnit("LF | VENDAS | CARREFOUR VALINHOS | POWER PLUS | AGO26", aliases);
    expect(out.source).toBe("auto");
    if (out.source === "auto") expect(out.unitId).toBe("u-carrefour");
  });

  test("alias multi-palavra vence alias mais curto (TOUR IPIRANGA)", () => {
    const out = parseCampaignUnit("LF | ENGAJAMENTO | TOUR IPIRANGA | JUL26", aliases);
    expect(out.source).toBe("auto");
    if (out.source === "auto") expect(out.unitId).toBe("u-ipiranga");
  });

  test("sigla colada: VI_TOTALPASS → não reconhece (VI não é alias)", () => {
    const out = parseCampaignUnit("VI_TOTALPASS", aliases);
    expect(out.source).toBe("unresolved");
    if (out.source === "unresolved") expect(out.reason).toBe("no-match");
  });

  test("ambíguo: menciona duas unidades diferentes", () => {
    const out = parseCampaignUnit("LF | IPIRANGA E AMOREIRAS | JUL26", aliases);
    expect(out.source).toBe("unresolved");
    if (out.source === "unresolved") {
      expect(out.reason).toBe("ambiguous");
      expect(out.candidates).toContain("IPIRANGA");
      expect(out.candidates).toContain("AMOREIRAS");
    }
  });

  test("case insensitive e sem acento", () => {
    const out = parseCampaignUnit("lf | vendas | mogí mirim | ago26", aliases);
    expect(out.source).toBe("auto");
    if (out.source === "auto") expect(out.unitId).toBe("u-mogi");
  });

  test("Anchieta preservada mas fora dos aliases → cai para unresolved", () => {
    const out = parseCampaignUnit("LF | VENDAS | ANCHIETA | AGO26", aliases);
    expect(out.source).toBe("unresolved");
  });

  test("matchAliases retorna apenas uma entrada por unidade quando há repetição", () => {
    // "IPIRANGA" aparece duas vezes; deve retornar só uma vez.
    const matched = matchAliases("IPIRANGA IPIRANGA IPIRANGA", aliases);
    expect(matched.filter((m) => m.unitId === "u-ipiranga").length).toBe(1);
  });

  test("evita casar 'VILA' quando 'VILA INDUSTRIAL' está presente", () => {
    const matched = matchAliases("LF | VENDAS | VILA INDUSTRIAL | AGO26", aliases);
    expect(matched.length).toBe(1);
    expect(matched[0].alias).toBe("VILA INDUSTRIAL");
  });

  test("evita casar 'CARREFOUR' quando 'CARREFOUR VALINHOS' está presente", () => {
    const matched = matchAliases("CARREFOUR VALINHOS", aliases);
    expect(matched.length).toBe(1);
    expect(matched[0].alias).toBe("CARREFOUR VALINHOS");
  });
});
