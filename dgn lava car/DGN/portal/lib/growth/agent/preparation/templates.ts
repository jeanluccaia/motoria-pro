import type { PreparationObjective, PreparationTone } from "../types.ts";

// -----------------------------------------------------------------------------
// Templates de mensagem preparados pela IA — arquitetura em blueprint por
// objetivo × implementação distinta por tom. A regra que era violada antes:
// "mais_direta" e "mais_consultiva" retornavam texto idêntico ao padrão. Aqui
// cada tom tem sua PRÓPRIA composição, sem transform genérico string→string.
//
// CONTRATO obrigatório para cada tom:
//   1. Preserva o CONTEXTO (quem somos, por que estamos falando).
//   2. Preserva o MOTIVO (Founder/renovação/follow-up/relacionamento).
//   3. Preserva o CTA (pergunta ou orientação clara ao final).
//
// Zero termo comercial inventado. Sem preço/desconto/lavagem/modalidades
// bloqueadas (ver lista canônica em lib/growth/dgn-plans.ts).
// Variáveis usadas: {firstName}, {vehicle}, {plan}.
// -----------------------------------------------------------------------------

interface TemplateArgs {
  firstName: string;
  vehicle?: string;
  plan?: string;
}

interface ToneComposition {
  padrao: (a: TemplateArgs) => string;
  mais_curta: (a: TemplateArgs) => string;
  mais_direta: (a: TemplateArgs) => string;
  mais_consultiva: (a: TemplateArgs) => string;
  mais_pessoal: (a: TemplateArgs) => string;
  menos_comercial: (a: TemplateArgs) => string;
}

function safeName(a: TemplateArgs): string {
  const trimmed = (a.firstName ?? "").trim();
  return trimmed || "Olá";
}

function vehicleLabel(v: string | undefined | null): string {
  const trimmed = (v ?? "").trim();
  if (!trimmed || trimmed === "—" || trimmed === "A definir") return "seu carro";
  return trimmed;
}

function planLabel(p: string | undefined | null): string {
  const trimmed = (p ?? "").trim();
  return trimmed || "DGN";
}

// -----------------------------------------------------------------------------
// FOUNDER ACQUISITION — objetivo: apresentar o programa e perguntar interesse.
// -----------------------------------------------------------------------------

const FOUNDER_ACQUISITION: ToneComposition = {
  padrao: (a) =>
    `${safeName(a)}, tudo bem? Aqui é da DGN Club. Vi seu histórico com a gente e queria te falar sobre o programa Founder — vagas limitadas, atendimento diferenciado. Faz sentido eu te enviar o convite?`,
  mais_curta: (a) =>
    `${safeName(a)}, tenho uma vaga do Founder DGN pra te apresentar. Faz sentido eu enviar o convite?`,
  mais_direta: (a) =>
    `${safeName(a)}, aqui é da DGN Club. Abriu uma vaga do programa Founder e o seu perfil encaixa. Posso te enviar o convite agora?`,
  mais_consultiva: (a) =>
    `${safeName(a)}, tudo bem? Aqui é da DGN Club. Estou fazendo uma leitura da nossa base pra entender quem faria sentido participar do programa Founder — e você apareceu. Antes de qualquer proposta, queria entender como está seu momento com o carro. Faz sentido conversarmos?`,
  mais_pessoal: (a) =>
    `Oi ${safeName(a)}! Aqui é da DGN Club — quem cuida do ${vehicleLabel(a.vehicle)} aqui é gente que conhece você. Abriu uma vaga do Founder e lembrei da gente. Topa eu te mandar o convite pra você olhar com calma?`,
  menos_comercial: (a) =>
    `${safeName(a)}, tudo bem? Aqui é da DGN Club. Queria trocar uma ideia com você sobre o atendimento — pega um horário pra a gente conversar?`,
};

// -----------------------------------------------------------------------------
// FOLLOWUP — objetivo: cliente já engajou (viu convite), retomar contato.
// -----------------------------------------------------------------------------

const FOLLOWUP: ToneComposition = {
  padrao: (a) =>
    `${safeName(a)}, tudo bem? Passei aqui só pra saber se você conseguiu ver o convite Founder que te mandei. Se tiver qualquer dúvida, me chama que eu explico rapidinho.`,
  mais_curta: (a) =>
    `${safeName(a)}, conseguiu ver seu convite Founder? Se ficou alguma dúvida, me chama que explico rapidinho.`,
  mais_direta: (a) =>
    `${safeName(a)}, você viu o convite Founder que te mandei? Me diz o que achou pra eu te ajudar no próximo passo.`,
  mais_consultiva: (a) =>
    `${safeName(a)}, tudo bem? Vi que você abriu o convite Founder. Antes de qualquer decisão, queria entender como está a rotina com o carro e se o formato faz sentido pra você agora — o que você achou?`,
  mais_pessoal: (a) =>
    `Oi ${safeName(a)}! Passando pra saber se o convite Founder chegou bem — se quiser bater um papo antes de decidir, me chama.`,
  menos_comercial: (a) =>
    `${safeName(a)}, tudo bem? Sobre o convite que te enviei — se você conseguiu ver e quiser conversar sem cerimônia, me chama.`,
};

// -----------------------------------------------------------------------------
// FOUNDER FOLLOWUP — relacionamento com Founder confirmado.
// -----------------------------------------------------------------------------

const FOUNDER_FOLLOWUP: ToneComposition = {
  padrao: (a) =>
    `${safeName(a)}, tudo bem? Passando pra manter contato como Founder da DGN Club. Se precisar de algo ou tiver algum ajuste no atendimento, me avisa.`,
  mais_curta: (a) =>
    `${safeName(a)}, tudo bem como Founder DGN? Se precisar de qualquer ajuste, me chama.`,
  mais_direta: (a) =>
    `${safeName(a)}, aqui é da DGN Club — check-in rápido com você como Founder. Tem algo pra ajustar no atendimento?`,
  mais_consultiva: (a) =>
    `${safeName(a)}, tudo bem? Como Founder da DGN, você é um dos primeiros a moldar como esse serviço evolui — queria saber como está sua experiência e o que a gente pode melhorar. O que você tem sentido?`,
  mais_pessoal: (a) =>
    `Fala ${safeName(a)}! Passando pra saber como você está — como Founder, a sua opinião move muita coisa por aqui. Me chama pra conversar?`,
  menos_comercial: (a) =>
    `${safeName(a)}, tudo bem? Passando pra manter contato. Se tiver algo que a gente possa melhorar no atendimento, me chama.`,
};

// -----------------------------------------------------------------------------
// RENEWAL — assinante com renovação pendente. Nunca cita preço/vencimento.
// -----------------------------------------------------------------------------

const RENEWAL: ToneComposition = {
  padrao: (a) =>
    `${safeName(a)}, tudo bem? Aqui é da DGN Club. Vi que sua assinatura ${planLabel(a.plan)} está com renovação pendente. Consegue me confirmar se posso te ajudar com o próximo passo?`,
  mais_curta: (a) =>
    `${safeName(a)}, sua assinatura ${planLabel(a.plan)} está com renovação pendente — consegue me confirmar como seguir?`,
  mais_direta: (a) =>
    `${safeName(a)}, aqui é da DGN Club. Sua assinatura ${planLabel(a.plan)} está pendente de renovação — me diz se posso encaminhar o próximo passo.`,
  mais_consultiva: (a) =>
    `${safeName(a)}, tudo bem? Aqui é da DGN Club. Vi que sua assinatura ${planLabel(a.plan)} está com renovação pendente. Antes de qualquer coisa, queria entender como você tem se sentido em relação ao serviço — faz sentido continuar como está?`,
  mais_pessoal: (a) =>
    `Oi ${safeName(a)}! Aqui é da DGN. Sua assinatura ${planLabel(a.plan)} tá pendente de renovação, e eu queria falar direto com você antes de qualquer coisa — conta pra mim como você tá vendo isso.`,
  menos_comercial: (a) =>
    `${safeName(a)}, tudo bem? Sua assinatura ${planLabel(a.plan)} está com renovação pendente — antes de qualquer coisa, queria saber como você tem se sentido com o atendimento. Se puder me chamar, me conta.`,
};

// -----------------------------------------------------------------------------
// REACTIVATION — cliente sem atendimento recente.
// -----------------------------------------------------------------------------

const REACTIVATION: ToneComposition = {
  padrao: (a) =>
    `${safeName(a)}, tudo bem? Faz um tempo que não vejo você por aqui. Se quiser trazer ${vehicleLabel(a.vehicle)}, me chama pra agendar um horário bom pra você.`,
  mais_curta: (a) =>
    `${safeName(a)}, faz um tempo. Quer trazer ${vehicleLabel(a.vehicle)}? Me diz um horário bom.`,
  mais_direta: (a) =>
    `${safeName(a)}, aqui é da DGN — faz um tempo. Se puder trazer ${vehicleLabel(a.vehicle)}, me diz o dia que te atendo.`,
  mais_consultiva: (a) =>
    `${safeName(a)}, tudo bem? Faz um tempo sem passagens do ${vehicleLabel(a.vehicle)} aqui. Aconteceu alguma coisa na sua rotina? Se fizer sentido retomar, me chama.`,
  mais_pessoal: (a) =>
    `Fala ${safeName(a)}! Sumido, hein? Se quiser trazer ${vehicleLabel(a.vehicle)}, me chama pra agendar. Tô por aqui.`,
  menos_comercial: (a) =>
    `${safeName(a)}, tudo bem? Passei aqui só pra manter contato — se um dia fizer sentido a gente conversar, me chama.`,
};

// -----------------------------------------------------------------------------
// RELATIONSHIP — cliente ativo, sem gatilho comercial claro.
// -----------------------------------------------------------------------------

const RELATIONSHIP: ToneComposition = {
  padrao: (a) =>
    `${safeName(a)}, tudo bem? Passando pra saber como está o atendimento com a gente. Se estiver tudo certo ou tiver algo que a gente possa melhorar, me chama.`,
  mais_curta: (a) =>
    `${safeName(a)}, como está o atendimento com a gente? Se tiver algo pra melhorar, me chama.`,
  mais_direta: (a) =>
    `${safeName(a)}, aqui é da DGN — check-in rápido. Tem algo pra ajustar no atendimento?`,
  mais_consultiva: (a) =>
    `${safeName(a)}, tudo bem? Estou olhando como cada cliente tem vivido a DGN e queria escutar você — o que a gente tem entregado bem, e o que dá pra evoluir?`,
  mais_pessoal: (a) =>
    `Oi ${safeName(a)}! Passei aqui só pra ver como você tá. Se tiver algo que dê pra melhorar no atendimento, me conta sem cerimônia.`,
  menos_comercial: (a) =>
    `${safeName(a)}, tudo bem? Passando pra manter contato — se precisar de algo, me chama.`,
};

const BY_OBJECTIVE: Record<PreparationObjective, ToneComposition> = {
  founder_acquisition: FOUNDER_ACQUISITION,
  followup: FOLLOWUP,
  founder_followup: FOUNDER_FOLLOWUP,
  renewal: RENEWAL,
  reactivation: REACTIVATION,
  relationship: RELATIONSHIP,
};

export function renderDraftMessage(params: {
  objective: PreparationObjective;
  tone: PreparationTone;
  firstName: string;
  vehicle?: string;
  plan?: string;
}): string {
  const composition = BY_OBJECTIVE[params.objective];
  const fn = composition[params.tone];
  return fn({
    firstName: params.firstName,
    vehicle: params.vehicle,
    plan: params.plan,
  });
}

/**
 * Compat com API antiga: aplicar tom a um texto arbitrário. Não é mais usado
 * internamente (renderDraftMessage escolhe a composição direto), mas continua
 * exportado para os testes de governança que verificam que nenhum transform
 * injeta oferta comercial.
 */
export function applyTone(text: string, _tone: PreparationTone): string {
  // Compat sink — retorna o próprio texto. Testes de governança usam para
  // provar que "aplicar tom" nunca introduz preço/desconto.
  return text;
}
