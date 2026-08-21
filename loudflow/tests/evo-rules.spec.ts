import { test, expect } from "@playwright/test";
import { classifySale, evaluatePayment } from "../src/lib/integrations/evo/rules";
import type { EvoSaleDetails } from "../src/lib/integrations/evo/types";

// Regra única de "venda paga" — se esta bateria quebrar, algum outro
// lugar do produto passou a contar Pix/boleto ainda pendente como
// conversão. NÃO relaxar sem checar a doc oficial da EVO.

test.describe("evaluatePayment", () => {
  test("venda com recebível confirmado (Pix pago) → paid", () => {
    const sale: EvoSaleDetails = {
      idSale: 12345,
      idBranch: 10,
      saleDate: "2026-08-14T10:00:00-03:00",
      removed: false,
      ammountPaid: 149.9,
      receivables: [
        {
          idReceivable: 1,
          ammountPaid: 149.9,
          receivingDate: "2026-08-14T10:05:00-03:00",
          paymentType: "Pix",
          status: "Recebido",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("paid");
    if (out.status === "paid") {
      expect(out.amountPaidCents).toBe(14990);
      expect(out.receivingDate).toBe("2026-08-14T10:05:00-03:00");
      expect(out.paymentType).toBe("Pix");
    }
  });

  test("Pix gerado mas sem confirmação → pending (não conta)", () => {
    const sale: EvoSaleDetails = {
      idSale: 12345,
      idBranch: 10,
      saleDate: "2026-08-14T10:00:00-03:00",
      removed: false,
      ammountPaid: 149.9,
      receivables: [
        {
          idReceivable: 1,
          ammountPaid: 149.9,
          receivingDate: null,
          paymentType: "Pix",
          status: "Aguardando pagamento",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
    expect(out.amountPaidCents).toBe(14990);
    expect(out.receivingDate).toBeNull();
    expect(out.paymentType).toBe("Pix");
  });

  test("Boleto gerado sem liquidação (receivingDate futura, status 'Aguardando') → pending", () => {
    const sale: EvoSaleDetails = {
      idSale: 999,
      removed: false,
      receivables: [
        {
          ammountPaid: 220,
          receivingDate: "2026-09-01T00:00:00-03:00", // vencimento futuro
          paymentType: "Boleto",
          status: "Pendente",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
  });

  test("venda com removed=true → cancelled (independente do recebível)", () => {
    const sale: EvoSaleDetails = {
      idSale: 42,
      removed: true,
      ammountPaid: 300,
      receivables: [
        {
          ammountPaid: 300,
          receivingDate: "2026-08-01T00:00:00-03:00",
          paymentType: "Credit Card",
          status: "Recebido",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("cancelled");
    expect(out.amountPaidCents).toBe(0);
    expect(out.reason).toContain("removed");
  });

  test("recebível com status 'Cancelado' NÃO conta como paid", () => {
    const sale: EvoSaleDetails = {
      idSale: 77,
      removed: false,
      receivables: [
        {
          ammountPaid: 100,
          receivingDate: "2026-08-14T00:00:00-03:00",
          paymentType: "Pix",
          status: "Cancelado",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
  });

  test("recebível com status 'Estornado' NÃO conta como paid", () => {
    const sale: EvoSaleDetails = {
      idSale: 78,
      removed: false,
      receivables: [
        {
          ammountPaid: 100,
          receivingDate: "2026-08-14T00:00:00-03:00",
          paymentType: "Pix",
          status: "Estornado",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
  });

  test("venda sem recebíveis (payload vazio) → pending com reason=no-receivables", () => {
    const sale: EvoSaleDetails = { idSale: 1, removed: false, receivables: [] };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
    expect(out.reason).toBe("no-receivables");
  });

  test("suporta 'amountPaid' (correção futura do typo pela EVO)", () => {
    const sale: EvoSaleDetails = {
      idSale: 2,
      removed: false,
      amountPaid: 50,
      receivables: [
        {
          amountPaid: 50,
          receivingDate: "2026-08-14",
          paymentType: "Pix",
          status: "Paid",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("paid");
    if (out.status === "paid") expect(out.amountPaidCents).toBe(5000);
  });

  test("soma múltiplos recebíveis pagos (parcelamento no cartão)", () => {
    const sale: EvoSaleDetails = {
      idSale: 100,
      removed: false,
      receivables: [
        {
          ammountPaid: 50,
          receivingDate: "2026-08-14",
          paymentType: "Credit Card",
          status: "Recebido",
        },
        {
          ammountPaid: 50,
          receivingDate: "2026-09-14",
          paymentType: "Credit Card",
          status: "Recebido",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("paid");
    if (out.status === "paid") expect(out.amountPaidCents).toBe(10000);
  });

  test("status só numérico (sem descrição) → pending (regra conservadora)", () => {
    const sale: EvoSaleDetails = {
      idSale: 200,
      removed: false,
      receivables: [
        {
          ammountPaid: 99,
          receivingDate: "2026-08-14",
          paymentType: "Pix",
          status: 3,
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
  });

  // ---------- Novos casos: EVO v2 devolve status/paymentType como OBJETO ----------
  //
  // Payload real observado em 2026-08-18 no endpoint GET /api/v2/sales:
  //   "status": { "id": 2, "name": "received" }
  //   "paymentType": { "id": 7, "name": "TransferenciaDeposito" }
  // A regra tem que extrair `.name` — ver extractStatusName/extractPaymentTypeName.

  test("status={id,name:'received'} com receivingDate + amount > 0 → paid", () => {
    const sale: EvoSaleDetails = {
      idSale: 657444,
      idBranch: 1,
      saleDate: "2026-08-01T00:00:00",
      removed: null,
      ammountPaid: 129.9,
      receivables: [
        {
          idReceivable: 1285050,
          ammountPaid: 129.9,
          receivingDate: "2026-08-17T09:55:49",
          paymentType: { id: 7, name: "TransferenciaDeposito" },
          status: { id: 2, name: "received" },
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("paid");
    if (out.status === "paid") {
      expect(out.amountPaidCents).toBe(12990);
      expect(out.paymentType).toBe("TransferenciaDeposito");
      expect(out.receivableStatus).toBe("received");
      expect(out.receivingDate).toBe("2026-08-17T09:55:49");
    }
  });

  test("status={name:'Recebido'} case-insensitive → paid", () => {
    const sale: EvoSaleDetails = {
      idSale: 1,
      removed: false,
      receivables: [
        {
          ammountPaid: 149.9,
          receivingDate: "2026-08-14",
          paymentType: { id: 1, name: "Pix" },
          status: { id: 2, name: "Recebido" },
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("paid");
    if (out.status === "paid") {
      expect(out.paymentType).toBe("Pix");
    }
  });

  test("status={name:'Cancelado'} → pending (cancelled keyword derruba)", () => {
    const sale: EvoSaleDetails = {
      idSale: 2,
      removed: false,
      receivables: [
        {
          ammountPaid: 99,
          receivingDate: "2026-08-14",
          paymentType: { id: 1, name: "Pix" },
          status: { id: 5, name: "Cancelado" },
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("pending");
    expect(out.receivableStatus).toBe("Cancelado");
  });

  test("paymentType permanece string quando string (compat com contrato antigo)", () => {
    const sale: EvoSaleDetails = {
      idSale: 3,
      removed: false,
      receivables: [
        {
          ammountPaid: 100,
          receivingDate: "2026-08-14",
          paymentType: "Boleto",
          status: "Recebido",
        },
      ],
    };
    const out = evaluatePayment(sale);
    expect(out.status).toBe("paid");
    if (out.status === "paid") expect(out.paymentType).toBe("Boleto");
  });
});

// ============================================================
// Classificador de elegibilidade — Fase 4.2
// ============================================================
//
// Só matrícula nova (com receivable pago) vira conversão.
// Renovações e vendas de produto/serviço ficam registradas mas
// NÃO são enviadas à UTMify.

function paidReceivable() {
  return [
    {
      ammountPaid: 149.9,
      receivingDate: "2026-08-14T10:05:00-03:00",
      paymentType: { id: 1, name: "Pix" },
      status: { id: 2, name: "received" },
    },
  ];
}

test.describe("classifySale", () => {
  test("matrícula nova (idMembership + registrationKind='new') → eligible", () => {
    const sale: EvoSaleDetails = {
      idSale: 1,
      removed: false,
      ammountPaid: 149.9,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idMembership: 42, description: "Matrícula" }],
      registrationKind: "new",
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(true);
  });

  test("matrícula com idMemberMembership (sem idMembership direto) → eligible", () => {
    const sale: EvoSaleDetails = {
      idSale: 2,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idMemberMembership: 99 }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(true);
  });

  test("registrationKind='renewal' → excluded:renewal", () => {
    const sale: EvoSaleDetails = {
      idSale: 3,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idMembership: 42 }],
      registrationKind: "renewal",
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("renewal");
  });

  test("registrationKind objeto enum {name:'Renovacao'} → excluded:renewal (normaliza)", () => {
    const sale: EvoSaleDetails = {
      idSale: 4,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idMembership: 42 }],
      registrationKind: { id: 2, name: "Renovacao" },
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("renewal");
  });

  test("idMembershipRenewed presente em item → excluded:renewal (mesmo sem kind)", () => {
    const sale: EvoSaleDetails = {
      idSale: 5,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idMembership: 42, idMembershipRenewed: 999 }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("renewal");
  });

  test("apenas idProduct → excluded:product-only", () => {
    const sale: EvoSaleDetails = {
      idSale: 6,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idProduct: 501, description: "Garrafa" }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("product-only");
  });

  test("apenas idService → excluded:service-only", () => {
    const sale: EvoSaleDetails = {
      idSale: 7,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idService: 301, description: "DayUse" }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("service-only");
  });

  test("saleItens vazio → excluded:no-membership", () => {
    const sale: EvoSaleDetails = {
      idSale: 8,
      removed: false,
      receivables: paidReceivable(),
      saleItens: [],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("no-membership");
  });

  test("removed=true → excluded:cancelled (antes de qualquer outra checagem)", () => {
    const sale: EvoSaleDetails = {
      idSale: 9,
      removed: true,
      receivables: paidReceivable(),
      saleItens: [{ idSaleItem: 1, idMembership: 42 }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("cancelled");
  });

  test("recebível pendente (Pix não confirmado) → excluded:not-paid", () => {
    const sale: EvoSaleDetails = {
      idSale: 10,
      removed: false,
      receivables: [
        {
          ammountPaid: 149.9,
          receivingDate: null,
          paymentType: { name: "Pix" },
          status: { name: "Waiting" },
        },
      ],
      saleItens: [{ idSaleItem: 1, idMembership: 42 }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(false);
    if (!c.eligible) expect(c.reason).toBe("not-paid");
  });

  test("saleItems (grafia alternativa) também é reconhecido", () => {
    const sale: EvoSaleDetails = {
      idSale: 11,
      removed: false,
      receivables: paidReceivable(),
      saleItems: [{ idSaleItem: 1, idMembership: 42 }],
    };
    const c = classifySale(sale);
    expect(c.eligible).toBe(true);
  });
});
