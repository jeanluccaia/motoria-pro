// Formatação em pt-BR para o painel. Consistente com o restante do app
// (moeda BRL, milhares com ".", decimais com ",").

const currencyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const integerFmt = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const percentFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const NOT_AVAILABLE_LABEL = "Não disponível";

export function formatCurrencyCents(cents: number | null | undefined): string {
  if (cents == null) return NOT_AVAILABLE_LABEL;
  return currencyFmt.format(cents / 100);
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null) return NOT_AVAILABLE_LABEL;
  return integerFmt.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return NOT_AVAILABLE_LABEL;
  return `${percentFmt.format(value)}%`;
}

export function formatDecimal(value: number | null | undefined, digits = 2): string {
  if (value == null) return NOT_AVAILABLE_LABEL;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
