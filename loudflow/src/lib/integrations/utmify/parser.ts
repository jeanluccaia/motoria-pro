// Parser de nomenclatura de campanha da Loud Fit.
//
// Padrão canônico observado:
//   "LF | VENDAS | IPIRANGA | POWER PLUS | AGO26"
//
// Variações reais:
//   "TOTALPASS | AMOREIRAS | WHATSAPP | AGO 2026"
//   "LF | ENGAJAMENTO | TOUR IPIRANGA | JUL26"
//   "LF | IPIRANGA | WHATSAPP | AGO26 Campanha"
//   "VI_TOTALPASS", "CF_TRIMESTRAL", "MM_TOTALPASS", "AM_TOTALPASS"
//
// Regras:
//   * a busca é por token exato dentro do nome normalizado — sem
//     correspondência vaga por trecho de palavra.
//   * mapeamento manual sempre vence o automático (aplicado fora daqui).
//   * campanha sem match único vira `{ unitId: null, source: 'unresolved' }`.

export type ParsedAlias = { alias: string; unitId: string };

export function normalizeName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // remove marcas combinantes (acentos)
    .replace(/[|/\\_,;:.\-—–]+/g, " ") // separadores viram espaço
    .replace(/[^\p{L}\p{N} ]+/gu, " ") // limpa símbolos residuais
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Tokenização por " " após normalização; útil para diagnóstico e testes.
export function tokensOf(raw: string): string[] {
  return normalizeName(raw).split(" ").filter(Boolean);
}

// Detecta match exato de multi-palavra (ex: "TOUR IPIRANGA", "CARREFOUR
// VALINHOS"). Retorna todas as unidades identificadas — se der mais de uma
// única resposta, o chamador decide como tratar.
export function matchAliases(name: string, aliases: ParsedAlias[]): ParsedAlias[] {
  const normalized = " " + normalizeName(name) + " ";
  const matched: ParsedAlias[] = [];

  // Ordenar por comprimento decrescente para privilegiar aliases longos
  // (ex: "TOUR IPIRANGA" bate antes de "IPIRANGA"; "CARREFOUR VALINHOS"
  // antes de "CARREFOUR").
  const sorted = [...aliases].sort((a, b) => b.alias.length - a.alias.length);

  const consumedRanges: Array<[number, number]> = [];
  const overlaps = (start: number, end: number) =>
    consumedRanges.some(([s, e]) => start < e && end > s);

  for (const a of sorted) {
    const needle = " " + a.alias + " ";
    let cursor = 0;
    while (true) {
      const idx = normalized.indexOf(needle, cursor);
      if (idx < 0) break;
      const start = idx + 1; // pula o espaço inicial
      const end = start + a.alias.length;
      if (!overlaps(start, end)) {
        consumedRanges.push([start, end]);
        if (!matched.some((m) => m.unitId === a.unitId)) matched.push(a);
        break;
      }
      cursor = idx + 1;
    }
  }

  return matched;
}

export type ParseOutcome =
  | { source: "auto"; unitId: string; matchedAlias: string }
  | { source: "unresolved"; reason: "no-match" | "ambiguous"; candidates: string[] };

// Regra final: um match exato → atribui. Zero ou dois-ou-mais → unresolved.
export function parseCampaignUnit(name: string, aliases: ParsedAlias[]): ParseOutcome {
  const matched = matchAliases(name, aliases);
  if (matched.length === 1) {
    return { source: "auto", unitId: matched[0].unitId, matchedAlias: matched[0].alias };
  }
  if (matched.length === 0) {
    return { source: "unresolved", reason: "no-match", candidates: [] };
  }
  return {
    source: "unresolved",
    reason: "ambiguous",
    candidates: matched.map((m) => m.alias),
  };
}
