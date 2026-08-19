import { test, expect } from "@playwright/test";
import { evaluatePayment } from "../src/lib/integrations/evo/rules";
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
