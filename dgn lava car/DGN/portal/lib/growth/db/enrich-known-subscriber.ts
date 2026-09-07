import "server-only";

import type { DgnCustomer } from "../dgn-growth-utils.ts";
import { matchKnownSubscriber } from "../founder-eligibility-server.ts";

// -----------------------------------------------------------------------------
// Enriquece cada customer com `knownSubscriberPlan` + `knownSubscriberStatus`
// (só o rótulo do plano e o status). Sem isso, o client precisaria importar
// `KNOWN_SUBSCRIBERS_2026_08_16`, que carrega telefone/placa/aliases de todos
// os 25 assinantes conhecidos para o bundle público — vetor P0 de vazamento
// antes deste hotfix.
// -----------------------------------------------------------------------------

export function enrichKnownSubscribers(customers: DgnCustomer[]): DgnCustomer[] {
  return customers.map((customer) => {
    const match = matchKnownSubscriber(customer);
    return {
      ...customer,
      knownSubscriberPlan: match ? match.record.plan : null,
      knownSubscriberStatus: match ? match.record.status : null,
    };
  });
}
