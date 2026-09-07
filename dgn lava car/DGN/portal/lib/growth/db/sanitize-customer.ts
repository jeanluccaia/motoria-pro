import "server-only";

import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { maskPlate } from "../dgn-growth-utils.ts";

// -----------------------------------------------------------------------------
// Sanitizador P0 de PII antes do payload cruzar a fronteira Server → Client.
//
// Antes deste hotfix, `renderGrowthWorkspace` passava a lista inteira de
// customers (2.354 no fixture, 1.156+ no DB) para o `<DgnGrowthWorkspace>`
// (client component). Como Next.js serializa a prop completa via RSC payload,
// telefone, placa, histórico de atendimento e notas comerciais dos ~1.150+
// clientes chegavam ao browser mesmo do operador visualizando 1 só.
//
// Regra: só o customer que o operador está de fato inspecionando (view=profile
// com id específico) recebe payload completo. Todos os outros vão mascarados —
// suficiente para popular listas/curadoria sem vazar PII operacional.
// -----------------------------------------------------------------------------

/** Campos PII que não devem cruzar para o browser fora do contexto do target. */
export function sanitizeCustomerForList(customer: DgnCustomer): DgnCustomer {
  const commercial = customer.commercial
    ? {
        ...customer.commercial,
        commercialNotes: "",
        nextAction: "",
      }
    : undefined;

  return {
    ...customer,
    phone: "", // desabilita CTA WhatsApp automaticamente (botão usa !customer.phone)
    plate: maskPlate(customer.plate),
    attendanceHistory: [],
    commercial,
    campaign: {
      ...customer.campaign,
      notes: "",
      selectionReason: customer.campaign.selectionReason ? "" : customer.campaign.selectionReason,
      lostReason: customer.campaign.lostReason ? "" : customer.campaign.lostReason,
    },
    curation: {
      ...customer.curation,
      internalNotes: "",
    },
  };
}

/**
 * Devolve a lista com todos os customers mascarados, exceto o `targetId` (que
 * fica completo — o operador está autorizado a ver esse porque acessou a
 * ficha diretamente).
 */
export function sanitizeCustomerListPayload(
  customers: DgnCustomer[],
  targetId: string | undefined,
): DgnCustomer[] {
  if (!targetId) return customers.map(sanitizeCustomerForList);
  return customers.map((customer) =>
    customer.id === targetId ? customer : sanitizeCustomerForList(customer),
  );
}
