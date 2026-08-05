import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { ConfigTabs } from "./config-tabs";

export default async function ConfigLayout({ children }: LayoutProps<"/config">) {
  await requireAdmin();

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Ajustes da organização"
        description="Convide pessoas e mantenha as unidades organizadas. Apenas administradores acessam esta área."
      />
      <ConfigTabs />
      <div className="mt-6">{children}</div>
    </>
  );
}
