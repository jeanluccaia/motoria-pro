import { GrowthDataError } from "@/components/growth/GrowthDataError";
import { CustomerFullscreen } from "@/components/growth/CustomerFullscreen";
import { loadGrowthData } from "@/lib/growth/db/growth-reader";

export const dynamic = "force-dynamic";

export default async function DgnGrowthCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const data = await loadGrowthData({ logger: console });
    const customer = data.customers.find((c) => c.id === id);
    if (!customer) {
      return <GrowthDataError message="Cliente não encontrado na fonte de dados atual." />;
    }

    return (
      <CustomerFullscreen
        customer={customer}
        dataOrigin={data.origin}
        backHref="/admin/growth/assinantes-detectados"
      />
    );
  } catch (error) {
    return (
      <GrowthDataError
        message={error instanceof Error ? error.message : "Erro inesperado de leitura."}
      />
    );
  }
}
