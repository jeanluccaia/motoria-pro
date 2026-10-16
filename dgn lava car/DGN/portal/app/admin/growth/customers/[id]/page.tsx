import { GrowthDataError } from "@/components/growth/GrowthDataError";
import { CustomerFullscreen } from "@/components/growth/CustomerFullscreen";
import { loadGrowthData } from "@/lib/growth/db/growth-reader";
import { DGN_SUBSCRIBER_PLANS, type DgnSubscriberPlan } from "@/lib/growth/dgn-plans";

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

  // ?plano=<Essential|Smart|Priority> — vem do link direto da entrada "Oferecer
  // assinatura" (modal da ficha ou compartilhamento). Qualquer valor fora da
  // lista oficial é descartado silenciosamente — jamais confia em query bruta.
  const rawPlan = query.plano;
  const planCandidate = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
  const initialPreselectedPlan: DgnSubscriberPlan | null =
    planCandidate && (DGN_SUBSCRIBER_PLANS as readonly string[]).includes(planCandidate)
      ? (planCandidate as DgnSubscriberPlan)
      : null;

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
        openCreateSubscription={openCreateSubscription || initialPreselectedPlan !== null}
        initialPreselectedPlan={initialPreselectedPlan}
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
