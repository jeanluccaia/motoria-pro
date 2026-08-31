// Label maps para enums internos. UI NUNCA renderiza o valor cru — passa
// pelo helper. Se o enum tem valor novo que ainda não foi mapeado, cai no
// fallback ("titleCase" simples com underscore → espaço).

const FOUNDER_STATUS_LABELS: Record<string, string> = {
  nao_avaliado: "Não avaliado",
  recomendado: "Recomendado",
  selecionado: "Selecionado",
  confirmado: "Confirmado",
  lista_espera: "Lista de espera",
  descartado: "Descartado",
};

const COMMERCIAL_STAGE_LABELS: Record<string, string> = {
  aguardando_analise: "Aguardando análise",
  pronto_para_contato: "Pronto para contato",
  contato_preparado: "Contato preparado",
  contatado: "Contatado",
  visualizou: "Visualizou",
  respondeu: "Respondeu",
  conversando: "Conversando",
  pagamento_enviado: "Pagamento enviado",
  convertido: "Convertido",
  descartado: "Descartado",
};

function titleCaseFallback(value: string): string {
  const clean = value.replace(/_/g, " ").trim();
  if (!clean) return "—";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function founderStatusLabel(status: string | undefined | null): string {
  const key = (status ?? "").toLowerCase();
  return FOUNDER_STATUS_LABELS[key] ?? titleCaseFallback(key || "nao_avaliado");
}

export function commercialStageLabel(stage: string | undefined | null): string {
  const key = (stage ?? "").toLowerCase();
  return COMMERCIAL_STAGE_LABELS[key] ?? titleCaseFallback(key || "aguardando_analise");
}
