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
// Estrutura observada nos exemplos oficiais — mantida como shape defensivo
// (todos os campos opcionais para tolerar variação entre unidades).
export type EvoReceivable = {
  idReceivable?: number | string | null;
  ammountPaid?: number | null;    // sim, EVO usa "ammount" com duplo M
  amountPaid?: number | null;     // fallback para futura correção do typo pela EVO
  receivingDate?: string | null;
  paymentType?: string | null;
  status?: string | number | null;
  statusDescription?: string | null;
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

export type EvoClient = {
  isConfigured(): boolean;
  fetchSale(idBranch: string, idSale: string): Promise<EvoFetchResult>;
};
