import { notFound } from "next/navigation";
import { DgnGrowthWorkspace } from "@/components/growth/DgnGrowthWorkspace";
import { getCustomerById } from "@/lib/growth/dgn-growth-data";

export default async function DgnGrowthCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!getCustomerById(id)) {
    notFound();
  }

  return <DgnGrowthWorkspace view="profile" customerId={id} />;
}
