import type { DgnCustomer } from "../dgn-growth-data.ts";
import { maskPhone, maskPlate } from "../dgn-growth-data.ts";
import { formatDatePtBr } from "../date-format.ts";

// -----------------------------------------------------------------------------
// Política de exibição de PII no Agent — canônica.
//
// Regra: o Agent NUNCA revela mais dado do que a UI de admin já expõe. Se o
// Perfil 360 mostra `(19) *****-1234` para telefone, o resumo 360 do Agent
// também mostra a versão mascarada. Isso vale tanto para o texto renderizado
// para o operador quanto para o payload enviado ao LLM (que é o mesmo).
//
// Se em algum momento futuro existir uma UX explícita "Ver dados completos"
// dentro do Perfil 360, ela terá que passar `{ unmask: true }` explicitamente
// aqui — mas isso é fora do escopo da Fase 2.
// -----------------------------------------------------------------------------

export interface PiiDisplayOptions {
  /** Se true, revela telefone e placa sem mascaramento. Fase 2: sempre false. */
  unmask?: boolean;
}

function fallback(value: string | undefined | null, placeholder = "—"): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed || trimmed === "A definir") return placeholder;
  return trimmed;
}

/**
 * Retorna o bloco "Identidade" do resumo 360 pronto para a UI/LLM,
 * mascarando PII sensível por padrão. Nomes/veículo/atendimento seguem visíveis
 * (não são PII sensível na política atual).
 */
export function buildDisplayIdentityRows(
  customer: DgnCustomer,
  options: PiiDisplayOptions = {},
): Array<{ label: string; value: string }> {
  const unmask = options.unmask === true;
  return [
    { label: "Nome", value: fallback(customer.name) },
    {
      label: "Telefone",
      value: unmask ? fallback(customer.phone) : maskPhone(customer.phone ?? ""),
    },
    { label: "Veículo", value: fallback(customer.vehicle) },
    {
      label: "Placa",
      value: unmask ? fallback(customer.plate) : maskPlate(customer.plate ?? ""),
    },
    { label: "Cliente desde", value: formatDatePtBr(customer.customerSince) },
    { label: "Último atendimento", value: formatDatePtBr(customer.lastAttendance) },
    { label: "Atendimentos", value: String(customer.washCount ?? 0) },
  ];
}

/** Formatação de score compatível com política visual pt-BR (82,5 em vez de 82.5). */
export function formatScoreDgn(score: number | undefined | null): string {
  if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) return "—";
  return score.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
