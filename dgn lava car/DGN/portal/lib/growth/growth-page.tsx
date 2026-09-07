import "server-only";
import { GrowthDataError } from "@/components/growth/GrowthDataError";
import { DgnGrowthWorkspace } from "@/components/growth/DgnGrowthWorkspace";
import { loadGrowthData } from "./db/growth-reader";
import { sanitizeCustomerListPayload } from "./db/sanitize-customer";
import { enrichKnownSubscribers } from "./db/enrich-known-subscriber";
import { getConfirmedFoundersCount } from "./founder-metrics-server";

export async function renderGrowthWorkspace(view: "intelligence" | "curadoria" | "founders" | "profile", customerId?: string) {
  try {
    const data = await loadGrowthData({ logger: console });
    if (customerId && !data.customers.some((customer) => customer.id === customerId)) return <GrowthDataError message="Cliente não encontrado na fonte de dados atual." />;
    // Server → Client:
    // 1. Enriquecer com knownSubscriberPlan (evita import de known-subscribers no client).
    // 2. Sanitizar PII — só o customer alvo passa completo.
    const enriched = enrichKnownSubscribers(data.customers);
    const payload = sanitizeCustomerListPayload(enriched, customerId);
    return (
      <DgnGrowthWorkspace
        view={view}
        customerId={customerId}
        initialCustomers={payload}
        dataOrigin={data.origin}
        readOnly={data.readOnly}
        confirmedFoundersCount={getConfirmedFoundersCount()}
      />
    );
  } catch (error) {
    return <GrowthDataError message={error instanceof Error ? error.message : "Erro inesperado de leitura."} />;
  }
}
