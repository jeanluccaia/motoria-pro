export type Scene = {
  id: string;
  title: string;
  caption: string;
  takeaway: string;
  route: string;
  action?: {
    label: string;
    kind: "openModal" | "selectPlan" | "closeModal" | "scroll";
  };
};

export const SCENES: Scene[] = [
  {
    id: "overview",
    title: "O dia inteiro em uma tela",
    caption:
      "O Command Center resume a operação da unidade, prioriza a próxima ação e evita que o empresário precise navegar entre sistemas.",
    takeaway: "9 atendimentos no dia, 1 oportunidade de alta prioridade.",
    route: "/",
  },
  {
    id: "opportunity",
    title: "Inteligência comercial em ação",
    caption:
      "A DGN monitora o comportamento de cada cliente e sugere a próxima oferta com justificativa — não um palpite, um sinal.",
    takeaway: "Roberta: 4 visitas em 4 meses, NPS 10, ticket R$ 480.",
    route: "/",
  },
  {
    id: "cliente-360",
    title: "Perfil 360° em 3 segundos",
    caption:
      "Um único clique mostra veículo, condição, histórico e oportunidade. Sem navegar entre abas, sem buscar.",
    takeaway: "Perfil demonstrativo da Roberta aberto.",
    route: "/clientes/roberta-vinciguerra",
  },
  {
    id: "oferta",
    title: "Oferta de assinatura em um clique",
    caption:
      "Três planos canônicos. A escolha vira preparação da conversa — não há cobrança nem contrato criado neste momento.",
    takeaway: "Essential · Smart · Priority — Priority é o recomendado.",
    route: "/clientes/roberta-vinciguerra?present=offer",
    action: { label: "Abrir oferta", kind: "openModal" },
  },
  {
    id: "confirmacao",
    title: "Preparação demonstrativa",
    caption:
      "Em produção, esse ponto conectaria PagBank, convite por WhatsApp e aceite do cliente. Aqui, apenas simulamos o próximo passo.",
    takeaway: "Nenhum contrato ou cobrança foi criado.",
    route: "/clientes/roberta-vinciguerra?present=confirmation",
    action: { label: "Selecionar Priority", kind: "selectPlan" },
  },
  {
    id: "saas",
    title: "A mesma plataforma, outra operação",
    caption:
      "Trocar DGN por Autobaths Jardim ou Cuida+ Automotivo é configuração — a inteligência comercial, a jornada e as integrações permanecem.",
    takeaway: "Tecnologia replicável. SaaS pronto para novos clientes.",
    route: "/?present=saas",
  },
];
