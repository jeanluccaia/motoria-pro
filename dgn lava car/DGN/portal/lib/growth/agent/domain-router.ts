// Classificador determinístico de domínio da pergunta do operador. Mesma
// definição consumida pelo `DeterministicAgentProvider` e pelos testes de
// regressão do P0 (bug "convite do Portal" caindo em Founder).
//
// Motivação: a palavra "convite" sozinha é AMBÍGUA. Portal e Founder ambos
// usam o termo. O classificador precisa exigir termos-âncora do domínio para
// escolher; se nenhum lado tem âncora, devolvemos AMBIGUOUS e o UI/agent pede
// desambiguação em vez de assumir Founder (padrão anterior, gerava resposta
// errada).

export type IntentDomain =
  | "SUBSCRIBER_PORTAL_ACCESS"
  | "FOUNDER_ACQUISITION"
  | "SUBSCRIPTION_SALES"
  | "SUBSCRIBER_RENEWAL"
  | "DAILY_BRIEFING"
  | "CUSTOMER_SUMMARY"
  | "AMBIGUOUS"
  | "OUT_OF_SCOPE";

export interface DomainClassification {
  domain: IntentDomain;
  /** Log/telemetria: qual regra bateu (útil para debug). */
  matchedRule: string;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Termos-âncora de cada domínio. Alguns termos são exclusivos ("magic link" só
// existe no Portal); outros são compartilhados e exigem casamento adicional
// para desempatar.
const PORTAL_STRONG = [
  "portal do assinante",
  "portal assinante",
  "acesso ao portal",
  "acesso do assinante",
  "convite do portal",
  "convite portal",
  "convite do app",
  "app do assinante",
  "primeiro acesso",
  "magic link",
  "liberar acesso",
  "ativou o portal",
  "ativou portal",
  "portal ativo",
  "login do assinante",
];

const PORTAL_SOFT = ["portal", "acesso", "login", "ativacao", "ativação", "senha", "app"];

const FOUNDER_STRONG = [
  "founder",
  "membro fundador",
  "vaga founder",
  "campanha founder",
  "convite founder",
  "curadoria",
  "curadoria founder",
  "curador",
  "n° 004",
  "no 004",
  "n 004",
  "nº004",
];

const FOUNDER_SOFT = ["fundador", "aquisicao", "aquisição", "prospect", "elegivel", "elegível"];

const SALES_TERMS = [
  "aderir",
  "contratar",
  "assinar dgn",
  "link de pagamento",
  "aderir smart",
  "aderir priority",
  "aderir corporate",
  "plano smart",
  "plano priority",
];

const RENEWAL_TERMS = ["renovacao", "renovação", "renovar", "renew", "vencimento"];

const BRIEFING_TERMS = [
  "quem devo chamar",
  "quem chamar hoje",
  "briefing",
  "prioridade do dia",
  "panorama",
  "carteira",
  "plano de ataque",
  "o que fazer hoje",
];

// "convidar" sozinho, sem qualificador. Se aparece isolado sem Portal/Founder
// concreto, é ambíguo e devemos pedir desambiguação.
const INVITE_TERMS = ["convite", "convidar", "convidamos"];

function includesAny(haystack: string, needles: string[]): string | null {
  for (const n of needles) {
    if (haystack.includes(n)) return n;
  }
  return null;
}

export function classifyDomain(rawInput: string): DomainClassification {
  const msg = normalize(rawInput);

  // 1) Portal — âncoras fortes ganham sempre.
  const portalStrong = includesAny(msg, PORTAL_STRONG);
  if (portalStrong) return { domain: "SUBSCRIBER_PORTAL_ACCESS", matchedRule: `portal_strong:${portalStrong}` };

  // 2) Founder — âncoras fortes ganham sobre "convite" solto.
  const founderStrong = includesAny(msg, FOUNDER_STRONG);
  if (founderStrong) return { domain: "FOUNDER_ACQUISITION", matchedRule: `founder_strong:${founderStrong}` };

  // 3) Sinais soft de Portal (portal/login/magic) + qualquer contexto de acesso.
  const portalSoft = includesAny(msg, PORTAL_SOFT);
  if (portalSoft) {
    // "portal" sozinho já é suficiente — não há outro Portal na plataforma.
    if (msg.includes("portal") || msg.includes("magic")) {
      return { domain: "SUBSCRIBER_PORTAL_ACCESS", matchedRule: `portal_soft:${portalSoft}` };
    }
    // "login"/"acesso"/"ativacao" ambíguos: exigem outra pista antes de
    // resolver para Portal (senão poderia ser sistema admin, etc.). Para o
    // universo DGN, considerar Portal por default é seguro — não há outro
    // fluxo "acesso do assinante".
    return { domain: "SUBSCRIBER_PORTAL_ACCESS", matchedRule: `portal_soft:${portalSoft}` };
  }

  // 4) Founder soft.
  const founderSoft = includesAny(msg, FOUNDER_SOFT);
  if (founderSoft) return { domain: "FOUNDER_ACQUISITION", matchedRule: `founder_soft:${founderSoft}` };

  // 5) Sales — adesão comercial.
  const salesHit = includesAny(msg, SALES_TERMS);
  if (salesHit) return { domain: "SUBSCRIPTION_SALES", matchedRule: `sales:${salesHit}` };

  // 6) Renovação — canal específico dos assinantes.
  const renewalHit = includesAny(msg, RENEWAL_TERMS);
  if (renewalHit) return { domain: "SUBSCRIBER_RENEWAL", matchedRule: `renewal:${renewalHit}` };

  // 7) "convite/convidar" isolado, sem âncora Portal/Founder = AMBIGUOUS.
  const inviteHit = includesAny(msg, INVITE_TERMS);
  if (inviteHit) return { domain: "AMBIGUOUS", matchedRule: `invite_alone:${inviteHit}` };

  // 8) Briefing do dia.
  const briefingHit = includesAny(msg, BRIEFING_TERMS);
  if (briefingHit) return { domain: "DAILY_BRIEFING", matchedRule: `briefing:${briefingHit}` };

  // 9) Se aparece "resuma"/"resumo"/"sobre <nome>", é sumário de cliente.
  if (/\b(resuma|resumo|sobre|conte sobre|fale sobre|cliente\s+)/.test(msg)) {
    return { domain: "CUSTOMER_SUMMARY", matchedRule: "customer_summary" };
  }

  return { domain: "OUT_OF_SCOPE", matchedRule: "no_match" };
}

/** Texto padrão pedindo desambiguação quando o operador só diz "convite". */
export const AMBIGUOUS_INVITE_PROMPT =
  "Você quer convite para o Portal do Assinante (liberar acesso/magic link) ou convite comercial Founder (aquisição/Curadoria)?";
