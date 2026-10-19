export type Scene = {
  id: string;
  title: string;
  caption: string;
  takeaway: string;
  route: string;
  /** Id do elemento envolvido em <PresentationHighlight> que deve ganhar ring dourado */
  highlight?: string;
  /** Flag para cena SaaS que troca o skin da marca. */
  skinOverride?: "second-brand";
};

/**
 * Cada cena deve apontar highlight para um elemento acima do viewport mínimo
 * esperado (para o scroll-into-view do PresentationProvider deslocar o conteúdo
 * corretamente). O painel narrativo fica no canto direito e nunca cobre o highlight.
 */
export const SCENES: Scene[] = [
  {
    id: "overview",
    title: "O dia inteiro em uma tela",
    caption:
      "O Command Center resume a operação, prioriza a próxima ação e evita que o empresário navegue entre sistemas",
    takeaway:
      "Operação ao vivo + oportunidades priorizadas, sem precisar abrir outro sistema",
    route: "/",
    highlight: "overview-next-action",
  },
  {
    id: "opportunity",
    title: "Inteligência comercial em ação",
    caption:
      "A plataforma monitora o comportamento de cada cliente e sugere a próxima oferta com justificativa — sinal, não palpite",
    takeaway:
      "Roberta: 3 avulsos em 90 dias · NPS 10 · perfil VIP → recomenda Priority",
    route: "/",
    highlight: "overview-next-action",
  },
  {
    id: "cliente-360",
    title: "Perfil 360° em 3 segundos",
    caption:
      "Um clique abre veículo, condição, histórico e oportunidade. Sem navegar entre abas, sem buscar",
    takeaway: "Perfil demonstrativo da Roberta aberto",
    route: "/clientes/roberta-vinciguerra",
    highlight: "customer-hero",
  },
  {
    id: "oferta",
    title: "Oferta de assinatura em um clique",
    caption:
      "Três planos canônicos. A escolha prepara a conversa — nenhum contrato ou cobrança criada neste momento",
    takeaway: "Essential · Smart · Priority — Priority é o recomendado",
    route: "/clientes/roberta-vinciguerra?present=offer",
  },
  {
    id: "estado-oferta",
    title: "A oportunidade vira estado",
    caption:
      "Após preparar a oferta, a plataforma passa a acompanhar o estado — na ficha do cliente e na Visão Geral — até o envio",
    takeaway:
      "Oferta Priority preparada · aguardando envio · nenhum contrato ou cobrança criada",
    route: "/?present=prepared",
    highlight: "overview-next-action",
  },
  {
    id: "saas",
    title: "A mesma plataforma, outra operação",
    caption:
      "Trocar DGN por outra marca é configuração — a inteligência comercial, a jornada e as integrações permanecem. Simulação visual, sem infraestrutura multi-tenant em produção",
    takeaway: "Northside Detailing · mesma plataforma, outra marca",
    route: "/?present=saas",
    skinOverride: "second-brand",
  },
];
