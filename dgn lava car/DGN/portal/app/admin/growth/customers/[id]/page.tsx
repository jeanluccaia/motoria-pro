import { renderGrowthWorkspace } from "@/lib/growth/growth-page";

export default async function DgnGrowthCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return renderGrowthWorkspace("profile", id);
}
