import { test, expect } from "@playwright/test";
import {
  deriveReachEstimated,
  normalizeMcpRow,
  normalizeMcpMetaResponse,
  type McpMetaAdObject,
  type McpMetaResponse,
} from "../src/lib/integrations/utmify/mcp";

// Testes unitários do adaptador de import a partir do payload MCP oficial
// da UTMify. Focam nas regras que a Fase 3.2A definiu como críticas:
//   * spend/revenue em centavos preservados como inteiros;
//   * reach só é estimado quando frequency > 0;
//   * salesFromFacebook nunca é venda;
//   * campanhas sem sinal são descartadas por padrão.

function baseCampaign(overrides: Partial<McpMetaAdObject> = {}): McpMetaAdObject {
  return {
    id: "c1",
    accountId: "acc1",
    campaignId: "c1",
    adsetId: null,
    adId: null,
    level: "campaign",
    name: "LF | VENDAS | IPIRANGA | AGO26",
    status: "ACTIVE",
    effectiveStatus: "ACTIVE",
    ca: "LOUD FIT Ipiranga",
    spend: 1234,
    impressions: 5000,
    inlineLinkClicks: 42,
    landingPageViews: 8,
    initiateCheckout: 2,
    leads: 0,
    conversations: 0,
    frequency: 1.25,
    approvedOrdersCount: 3,
    pendingOrdersCount: 1,
    refundedOrdersCount: 0,
    revenue: 20000,
    grossRevenue: 25000,
    ...overrides,
  };
}

test.describe("MCP adapter — normalização", () => {
  test("preserva spend/revenue em centavos", () => {
    const row = normalizeMcpRow(baseCampaign());
    expect(row.spendCents).toBe(1234);
    expect(row.revenueCents).toBe(20000);
    expect(row.grossRevenueCents).toBe(25000);
  });

  test("deriva reach estimado apenas com frequency > 0", () => {
    expect(deriveReachEstimated(1000, 2)).toBe(500);
    expect(deriveReachEstimated(1000, 0)).toBeNull();
    expect(deriveReachEstimated(1000, null)).toBeNull();
    expect(deriveReachEstimated(null, 2)).toBeNull();
  });

  test("reach é null quando frequency é zero ou ausente", () => {
    expect(normalizeMcpRow(baseCampaign({ frequency: 0 })).reachEstimated).toBeNull();
    expect(normalizeMcpRow(baseCampaign({ frequency: null })).reachEstimated).toBeNull();
  });

  test("preserva approved/pending/refunded como number NOT NULL", () => {
    const row = normalizeMcpRow(baseCampaign({ approvedOrdersCount: 5 }));
    expect(row.approvedOrdersCount).toBe(5);
    const zero = normalizeMcpRow(baseCampaign({ approvedOrdersCount: null }));
    expect(zero.approvedOrdersCount).toBe(0);
  });

  test("landingPageViews/initiateCheckout/leads/conversations aceitam null", () => {
    const row = normalizeMcpRow(
      baseCampaign({ landingPageViews: null, initiateCheckout: null, leads: null, conversations: null }),
    );
    expect(row.landingPageViews).toBeNull();
    expect(row.initiateCheckouts).toBeNull();
    expect(row.leads).toBeNull();
    expect(row.conversations).toBeNull();
  });

  test("prefere campaignId sobre id como externalId", () => {
    const row = normalizeMcpRow(baseCampaign({ id: "other", campaignId: "c-real" }));
    expect(row.externalId).toBe("c-real");
  });

  test("descarta linhas sem sinal por padrão", () => {
    const payload: McpMetaResponse = {
      results: [
        baseCampaign({ campaignId: "c-signal" }),
        baseCampaign({
          campaignId: "c-zero",
          spend: 0,
          impressions: 0,
          inlineLinkClicks: 0,
          landingPageViews: 0,
          initiateCheckout: 0,
          leads: 0,
          conversations: 0,
          approvedOrdersCount: 0,
          pendingOrdersCount: 0,
          revenue: 0,
          grossRevenue: 0,
        }),
      ],
    };
    const out = normalizeMcpMetaResponse({ date: "2026-08-07", payload });
    expect(out.rows.length).toBe(1);
    expect(out.rows[0].externalId).toBe("c-signal");
  });

  test("keepZeroExposure: true mantém tudo mesmo sem sinal", () => {
    const payload: McpMetaResponse = {
      results: [
        baseCampaign({ campaignId: "c-zero", spend: 0, impressions: 0, inlineLinkClicks: 0 }),
      ],
    };
    const out = normalizeMcpMetaResponse({ date: "2026-08-07", payload }, { keepZeroExposure: true });
    expect(out.rows.length).toBe(1);
  });

  test("descarta entradas com level diferente de 'campaign'", () => {
    const payload: McpMetaResponse = {
      results: [
        baseCampaign({ campaignId: "c-ok" }),
        { ...baseCampaign({ campaignId: "c-adset" }), level: "adset" },
      ],
    };
    const out = normalizeMcpMetaResponse({ date: "2026-08-07", payload });
    expect(out.rows.length).toBe(1);
    expect(out.rows[0].externalId).toBe("c-ok");
  });

  test("usa 'ca' (padrão MCP) como nome da conta", () => {
    const row = normalizeMcpRow(baseCampaign({ ca: "LOUD FIT Amoreiras e Mogi Mirim" }));
    expect(row.externalAccountName).toBe("LOUD FIT Amoreiras e Mogi Mirim");
  });

  test("effectiveStatus vence status para o campo status", () => {
    const row = normalizeMcpRow(baseCampaign({ status: "ACTIVE", effectiveStatus: "PAUSED" }));
    expect(row.status).toBe("PAUSED");
  });
});
