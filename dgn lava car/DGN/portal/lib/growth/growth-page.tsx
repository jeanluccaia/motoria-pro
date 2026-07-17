import "server-only";
import { GrowthDataError } from "@/components/growth/GrowthDataError";
import { DgnGrowthWorkspace } from "@/components/growth/DgnGrowthWorkspace";
import { loadGrowthData } from "./db/growth-reader";

export async function renderGrowthWorkspace(view: "intelligence" | "curadoria" | "founders" | "profile", customerId?: string) {
  try {
    const data = await loadGrowthData({ logger: console });
    if (customerId && !data.customers.some((customer) => customer.id === customerId)) return <GrowthDataError message="Cliente não encontrado na fonte de dados atual." />;
    return <DgnGrowthWorkspace view={view} customerId={customerId} initialCustomers={data.customers} dataOrigin={data.origin} readOnly={data.readOnly} />;
  } catch (error) {
    return <GrowthDataError message={error instanceof Error ? error.message : "Erro inesperado de leitura."} />;
  }
}
