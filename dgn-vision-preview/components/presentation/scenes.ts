export type Scene = {
  id: string;
  title: string;
  caption: string;
  takeaway: string;
  route: string;
  /** Id do elemento envolvido em <PresentationHighlight> que deve ganhar ring dourado */
  highlight?: string;
};

export const SCENES: Scene[] = [
  {
    id: "overview",
    title: "O dia inteiro em uma tela",
    caption:
      "O Command Center resume a operação, prioriza a próxima ação e evita que o empresário navegue entre sistemas.",
    takeaway: "9 atendimentos hoje · 1 oportunidade de alta prioridade.",
    route: "/",
    highlight: "overview-kpis",
  },
  {
    id: "opportunity",
    title: "Inteligência comercial em ação",
    caption:
      "A DGN monitora o comportamento de cada cliente e sugere a próxima oferta com justificativa — não um palpite, um sinal.",
    takeaway: "Roberta: 4 visitas em 4 meses, NPS 10, ticket médio R$ 480.",
    route: "/",
    highlight: "overview-next-action",
  },
  {
    id: "cliente-360",
    title: "Perfil 360° em 3 segundos",
    caption:
      "Um clique mostra veículo, condição, histórico e oportunidade. Sem navegar entre abas, sem buscar.",
    takeaway: "Perfil demonstrativo da Roberta aberto.",
    route: "/clientes/roberta-vinciguerra",
    highlight: "customer-hero",
  },
  {
    id: "oferta",
    title: "Oferta de assinatura em um clique",
    caption:
      "Três planos canônicos. A escolha prepara a conversa — nenhum contrato, nenhuma cobrança criada neste momento.",
    takeaway: "Essential · Smart · Priority — Priority é o recomendado.",
    route: "/clientes/roberta-vinciguerra?present=offer",
  },
  {
    id: "confirmacao",
    title: "Preparação demonstrativa",
    caption:
      "Em produção, aqui enviaríamos o convite por WhatsApp e abriríamos o checkout. No preview, apenas simulamos o próximo passo.",
    takeaway: "Nenhum contrato ou cobrança foi criado.",
    route: "/clientes/roberta-vinciguerra?present=confirmation",
  },
  {
    id: "saas",
    title: "A mesma plataforma, outra operação",
    caption:
      "Trocar DGN por outra marca é configuração — a inteligência comercial, a jornada e as integrações permanecem.",
    takeaway: "Demonstração conceitual de SaaS replicável.",
    route: "/?present=saas",
  },
];
