import type { AttentionCard } from "../types.ts";
import { sortByPriority } from "./founder-attention.ts";

/**
 * Consolida a fila de atenção de forma que 1 customer = 1 card no briefing.
 *
 * Regra canônica (spec P0):
 *   - Identidade = `customer.customerId`. Nome/legacy_id nunca contam.
 *   - Cards sem `customerId` (ex.: `subscriber-renewal:<nome>` quando não há
 *     match no snapshot) são mantidos como estão — dedupe cega por nome geraria
 *     falso positivo entre homônimos.
 *   - Sort estável por prioridade acontece ANTES do dedupe: o card vencedor é
 *     o de maior prioridade; kinds derrotados viram `secondaryKinds` para
 *     preservar o contexto sem duplicar cards.
 *   - Sem duplicar `kind` em `secondaryKinds` (dedupe interno).
 *   - Não modifica os cards de entrada — retorna cópias rasas com o novo
 *     campo. Cards sem sinal secundário mantêm `secondaryKinds` ausente
 *     (evita ruído na serialização/UI).
 */
export function dedupeAttentionCards(cards: AttentionCard[]): AttentionCard[] {
  const ordered = cards.slice().sort(sortByPriority);
  const winners = new Map<string, AttentionCard>();
  const secondary = new Map<string, AttentionCard["kind"][]>();
  const passthrough: AttentionCard[] = [];
  const order: Array<{ key: string; sortIndex: number } | { passthroughIndex: number }> = [];

  ordered.forEach((card, idx) => {
    if (!card.customerId) {
      passthrough.push(card);
      order.push({ passthroughIndex: passthrough.length - 1 });
      return;
    }
    const key = card.customerId;
    const winner = winners.get(key);
    if (!winner) {
      winners.set(key, card);
      order.push({ key, sortIndex: idx });
      return;
    }
    // Já existe um vencedor com prioridade >= atual (sort é estável +
    // ascendente). Registra o kind derrotado como secundário, sem duplicar.
    if (card.kind === winner.kind) return;
    const existing = secondary.get(key) ?? [];
    if (!existing.includes(card.kind)) existing.push(card.kind);
    secondary.set(key, existing);
  });

  const output: AttentionCard[] = [];
  for (const item of order) {
    if ("passthroughIndex" in item) {
      output.push(passthrough[item.passthroughIndex]!);
      continue;
    }
    const winner = winners.get(item.key)!;
    const kinds = secondary.get(item.key);
    output.push(kinds && kinds.length > 0 ? { ...winner, secondaryKinds: kinds } : winner);
  }
  return output;
}

/** Contagem de casos únicos = customer_ids distintos + passthrough sem customerId. */
export function countUniqueCases(cards: AttentionCard[]): number {
  const seen = new Set<string>();
  let passthrough = 0;
  for (const card of cards) {
    if (!card.customerId) passthrough += 1;
    else seen.add(card.customerId);
  }
  return seen.size + passthrough;
}
