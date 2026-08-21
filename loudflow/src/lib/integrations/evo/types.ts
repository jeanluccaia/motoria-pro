// Contratos da integração EVO / W12.
//
// Payload do webhook NewSale (subset relevante) — a EVO envia estes campos
// em todas as ocorrências. Outros campos podem existir e são ignorados.
export type EvoWebhookPayload = {
  IdW12?: string | number | null;
  IdBranch?: string | number | null;
  IdRecord?: string | number | null;
  EventType?: string | null;
  ApiCallback?: string | null;
};

// Detalhe da venda retornado por GET /api/v2/sales/{IdRecord}?showReceivables=true
// e por GET /api/v2/sales (listagem paginada).
// Estrutura defensiva (todos os campos opcionais).
//
// IMPORTANTE (2026-08-18): a EVO devolve `status` e `paymentType` como
// OBJETOS `{ id, name }` no endpoint moderno (v2), mas versões antigas
// devolviam string simples ("Recebido", "Pix"). Aceitamos ambos —
// o helper `extractStatusName`/`extractPaymentTypeName` em `rules.ts`
// e o mapPaymentMethod em `deliver.ts` extraem `.name` quando objeto.
export type EvoEnumLike = { id?: number | string | null; name?: string | null };

export type EvoReceivable = {
  idReceivable?: number | string | null;
  ammountPaid?: number | null;    // sim, EVO usa "ammount" com duplo M
  amountPaid?: number | null;     // fallback para futura correção do typo pela EVO
  ammount?: number | null;        // valor total do recebível (não pago)
  receivingDate?: string | null;
  paymentType?: string | EvoEnumLike | null;
  status?: string | number | EvoEnumLike | null;
  statusDescription?: string | null;
};

// Item da venda (linha do saleItens[]). A EVO diferencia matrícula,
// produto e serviço via idMembership/idProduct/idService.
// Uma venda pode ter múltiplos itens; para classificação de conversão
// usamos apenas os que representam matrícula (idMembership presente).
//
// idMembershipRenewed é a assinatura de que a linha é continuação de
// uma matrícula anterior — sinal forte de renovação, mesmo quando
// `registrationKind` vier ausente.
export type EvoSaleItem = {
  idSaleItem?: number | string | null;
  idMembership?: number | string | null;
  idMemberMembership?: number | string | null;
  idMembershipRenewed?: number | string | null;
  idProduct?: number | string | null;
  idService?: number | string | null;
  description?: string | null;
  // Alguns endpoints devolvem valor por item (útil futuramente).
  ammountPaid?: number | null;
  amountPaid?: number | null;
};

export type EvoSaleDetails = {
  idSale?: number | string | null;
  idBranch?: number | string | null;
  idMember?: number | string | null;
  saleDate?: string | null;
  removed?: boolean | null;
  ammountPaid?: number | null;
  amountPaid?: number | null;
  receivables?: EvoReceivable[] | null;
  // Presente no endpoint GET /api/v2/sales (listagem). No endpoint
  // GET /api/v2/sales/{id} pode não vir; nesse caso o consumidor cai
  // no fallback `fetchMember(idMember)`.
  member?: EvoMemberDetails | null;
  // saleItens (sim, com um N a mais — é como a EVO devolve).
  // Aceitamos também `saleItems` / `items` defensivamente porque
  // versões antigas / documentação divergem.
  saleItens?: EvoSaleItem[] | null;
  saleItems?: EvoSaleItem[] | null;
  items?: EvoSaleItem[] | null;
  // 'renewal' | 'new' | ... — nome de enum estático da EVO.
  // Aceitamos string ou EvoEnumLike.
  registrationKind?: string | EvoEnumLike | null;
  registrationType?: string | EvoEnumLike | null;
};

// Contato do aluno (dentro de EvoMemberDetails.contacts[]).
// A EVO devolve email como um contact com contactType='E-mail' e o valor
// em `description`; cellphone como contactType='Cellphone' idem.
export type EvoMemberContact = {
  idContactType?: number | null;
  contactType?: string | null;   // 'E-mail' | 'Cellphone' | ...
  ddi?: string | null;
  description?: string | null;   // valor cru (email ou dígitos)
};

// Detalhe do aluno retornado por GET /api/v2/members/{idMember} OU inline
// em `sale.member` do endpoint GET /api/v2/sales.
// Shape defensivo — todos os campos opcionais. O uso é EXCLUSIVAMENTE
// para enriquecer a conversão paga (envio server-to-server para UTMify);
// nada aqui é persistido em banco.
export type EvoMemberDetails = {
  idMember?: number | string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;         // fallback quando EVO devolve nome único
  registerName?: string | null; // fallback: nome de cadastro observado no /api/v2/sales
  registerLastName?: string | null;
  email?: string | null;
  cellphone?: string | null;    // formato mais comum devolvido pela EVO
  phone?: string | null;        // fallback
  document?: string | null;     // CPF (opcional)
  documentId?: string | null;   // fallback observado
  contacts?: EvoMemberContact[] | null;
};

export type EvoFetchError = {
  code:
    | "not-configured"
    | "unauthorized"
    | "not-found"
    | "rate-limited"
    | "timeout"
    | "network"
    | "unknown";
  message: string;
};

export type EvoFetchResult =
  | { ok: true; sale: EvoSaleDetails }
  | { ok: false; error: EvoFetchError };

export type EvoMemberFetchResult =
  | { ok: true; member: EvoMemberDetails }
  | { ok: false; error: EvoFetchError };

export type EvoListSalesParams = {
  updatedReceivableStartDate: string; // ISO UTC
  updatedReceivableEndDate: string;   // ISO UTC
  take?: number;                       // page size (default 100)
  skip?: number;                       // offset (default 0)
  idBranch?: string;                   // opcional; sem filtro se ausente
  // Filtra no lado da EVO só vendas de matrícula (não produtos avulsos).
  // Reduz drasticamente o volume da resposta e casos que precisamos
  // descartar no classificador. Sem este filtro a EVO devolve TUDO.
  onlyMembership?: boolean;
};

export type EvoListSalesResult =
  | { ok: true; sales: EvoSaleDetails[] }
  | { ok: false; error: EvoFetchError };

export type EvoClient = {
  isConfigured(): boolean;
  fetchSale(idBranch: string, idSale: string): Promise<EvoFetchResult>;
  fetchMember(idMember: string): Promise<EvoMemberFetchResult>;
  listSales(params: EvoListSalesParams): Promise<EvoListSalesResult>;
};
