/**
 * Base operacional aprovada dos assinantes ativos DGN/4uCar.
 *
 * Fonte: ASSINANTES_ATIVOS_4UCAR_2026-08-16.xlsx (25 clientes consolidados
 * com utilização de plano recente, dos quais 3 aparecem como
 * "renovação pendente" no controle de vencimentos).
 *
 * Regra fundamental: **nenhum destes clientes é elegível para receber
 * convite Founder de aquisição**. Assinantes ativos e renovações pendentes
 * ficam fora da fila de Curadoria — Curadoria é fila de aquisição.
 *
 * Preservações Founder (números fixos, nunca renumerar):
 *   Nº001 Benedito Constantino · Nº002 José Moreira · Nº003 Rikardo Oliveira
 * Vaga Nº004 reaberta: Iara Menezes (assinante Priority — não elegível).
 */

export type KnownSubscriberStatus = "ativo" | "renovacao_pendente";

export interface KnownSubscriberRecord {
  name: string;
  aliases?: string[];
  phones: string[]; // números brutos, serão normalizados pelo helper
  plates: string[];
  plan: "Essential" | "Smart" | "Priority";
  status: KnownSubscriberStatus;
  preservedFounderNumber?: string; // 001, 002, 003 → nunca renumerar
  isReopenedFounder?: boolean;      // Iara Nº004 reaberta
  note?: string;
}

export const KNOWN_SUBSCRIBERS_2026_08_16: KnownSubscriberRecord[] = [
  { name: "Rodney Carvalho", phones: ["11971813620"], plates: ["UEN4C07", "TCU9A06"], plan: "Essential", status: "ativo", note: "Dois veículos (Atto 8 + Jeep Commander)." },
  { name: "Rikardo Oliveira", phones: ["19999037494"], plates: ["QXP9H50"], plan: "Priority", status: "ativo", preservedFounderNumber: "003" },
  { name: "Benedito Constantino", phones: ["19981723362"], plates: ["BRY0H64"], plan: "Priority", status: "ativo", preservedFounderNumber: "001" },
  { name: "Guido Sabbadin", phones: ["19981118226"], plates: ["SIC4F94"], plan: "Essential", status: "ativo" },
  { name: "Guilherme Lopes", phones: ["19993890842"], plates: ["TKO5G04", "TJX2D23"], plan: "Priority", status: "ativo", note: "Dois veículos ativos (Song Plus + Ora 03)." },
  { name: "William Farias", phones: ["19993658346"], plates: [], plan: "Smart", status: "renovacao_pendente" },
  { name: "José Moreira", aliases: ["Jose Moreira"], phones: ["19998115400"], plates: ["EOA3940"], plan: "Smart", status: "ativo", preservedFounderNumber: "002" },
  { name: "Juliana de Oliveira", phones: ["19983886119"], plates: [], plan: "Priority", status: "ativo" },
  { name: "Rodmich Equipamentos Ltda", aliases: ["Rodmich"], phones: ["19982256428"], plates: [], plan: "Smart", status: "ativo" },
  { name: "Wellington Felix", phones: ["19981260520"], plates: ["SWR0J66"], plan: "Priority", status: "ativo" },
  { name: "Paulo Daniel", aliases: ["Paulo"], phones: ["19983881149"], plates: ["FMP4C02"], plan: "Priority", status: "renovacao_pendente" },
  { name: "Juan Infante", phones: ["19999117707"], plates: [], plan: "Essential", status: "ativo" },
  { name: "Nina de Melo", aliases: ["Medley Nina", "Nina"], phones: ["19991319301"], plates: ["QOW8A93"], plan: "Smart", status: "renovacao_pendente", note: "Nome correto: Nina de Melo. Medley é o local de trabalho." },
  { name: "Débora", aliases: ["Debora"], phones: ["19991704872"], plates: [], plan: "Smart", status: "ativo" },
  { name: "Suely Maria", aliases: ["Suely Maria Diniz", "Suely"], phones: ["19997983530"], plates: ["FQV2H04"], plan: "Smart", status: "ativo", note: "Nome correto Suely Maria; Genebra é bairro." },
  { name: "David Lisboa", phones: ["11999758344"], plates: [], plan: "Smart", status: "ativo" },
  { name: "Bruno Rossetti", phones: ["12991465695"], plates: [], plan: "Essential", status: "ativo" },
  { name: "Thiago Fabiano", phones: ["19995735275"], plates: [], plan: "Smart", status: "ativo" },
  { name: "Aline Fernandes", phones: ["14996105399"], plates: [], plan: "Smart", status: "ativo" },
  { name: "Ronaldo Faria", phones: ["19997621279"], plates: ["TCZ6A61"], plan: "Essential", status: "ativo", note: "Titular do veículo; Thais/Trouw é referência operacional." },
  { name: "Daniela Cavalheiro", phones: ["19998141275"], plates: [], plan: "Essential", status: "ativo" },
  { name: "Iara Menezes", aliases: ["Iara"], phones: ["19991931501"], plates: ["FUR8369"], plan: "Priority", status: "ativo", isReopenedFounder: true, note: "Vaga Nº004 reaberta — assinante Priority. Não elegível para aquisição." },
  { name: "Viviane", aliases: ["Marm Viviane"], phones: ["19974132039"], plates: ["BIJ0J75"], plan: "Smart", status: "ativo" },
  { name: "Ana Silveira", phones: ["11992357937"], plates: ["SIT9F03"], plan: "Smart", status: "ativo" },
  { name: "Lumini III Gustavo Plensack", aliases: ["Gustavo Plensack", "Lumini"], phones: ["11963585627"], plates: ["FLW2D77"], plan: "Smart", status: "ativo" },
];

// Legacy IDs presentes no JSON operacional que já correspondem a assinantes conhecidos.
// Usado como sinal complementar quando o cliente não bate por nome/telefone/placa
// (nome muito diferente do cadastro legado, por exemplo).
export const KNOWN_SUBSCRIBER_LEGACY_IDS = new Set<string>([
  "benedito-constantino",
  "jose-moreira",
  "rikardo-oliveira",
  "iara",
]);
