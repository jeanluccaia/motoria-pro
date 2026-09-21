// Helpers puros do SubscriptionsManager — sem React, sem side-effects.
// Ficam fora do .tsx pra permitir teste unitário via node:test.

/** Data local YYYY-MM-DD "hoje" (respeita o fuso do runtime — usada só na UI). */
export function todayLocalIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * P0.2: bloqueia data de fim de vigência no passado.
 * Espera formato ISO curto do <input type="date"> (YYYY-MM-DD).
 * "" (vazio) NÃO é passado — quem chama decide se input vazio é permitido.
 */
export function isPastDateInput(input: string): boolean {
  if (!input || input.length < 10) return false;
  return input < todayLocalIso();
}

// -----------------------------------------------------------------------------
// P1: tradução PT dos enums P0 (payment_status/method/evidence_source).
// -----------------------------------------------------------------------------

export function translatePaymentStatus(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "confirmed": return "Confirmado";
    case "pending":   return "Pendente";
    case "failed":    return "Falhou";
    case "refunded":  return "Estornado";
    case "unknown":   return "Não informado";
    case "":          return "Não informado";
    default:          return status ?? "Não informado";
  }
}

export function translatePaymentMethod(method: string | null | undefined): string {
  switch ((method ?? "").toLowerCase()) {
    case "card_recurring": return "Cartão recorrente";
    case "manual":         return "Manual";
    case "unknown":        return "Não informado";
    case "":               return "Não informado";
    default:               return method ?? "Não informado";
  }
}

export function translateEvidenceSource(evidence: string | null | undefined): string {
  switch ((evidence ?? "").toLowerCase()) {
    case "provider": return "PagBank";
    case "manual":   return "Manual";
    case "legacy":   return "Legado";
    case "unknown":  return "Não informado";
    case "":         return "Não informado";
    default:         return evidence ?? "Não informado";
  }
}
