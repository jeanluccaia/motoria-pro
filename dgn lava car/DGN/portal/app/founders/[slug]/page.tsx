import { renderFounderPublicPage } from "@/lib/founder-public-page";

export const dynamic = "force-dynamic";

export default async function DynamicFounderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderFounderPublicPage(slug);
}
