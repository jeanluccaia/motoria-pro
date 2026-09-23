import { GrowthDataError } from "@/components/growth/GrowthDataError";
import { CustomerFullscreen } from "@/components/growth/CustomerFullscreen";
import { loadGrowthData } from "@/lib/growth/db/growth-reader";

export const dynamic = "force-dynamic";

export default async function DgnGrowthCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const rawFlag = query.novaAssinatura;
  const openCreateSubscription = (Array.isArray(rawFlag) ? rawFlag[0] : rawFlag) === "1";

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
        openCreateSubscription={openCreateSubscription}
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
