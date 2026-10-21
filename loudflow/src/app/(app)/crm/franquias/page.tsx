import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { LeadsView } from "./leads-view";
import type { FranchiseLead, FranchiseLeadActivity } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "CRM — Leads de Franquia" };
export const dynamic = "force-dynamic";

export default async function CrmFranquiasPage() {
  const session = await requireSession();

  // Operador do CRM: admin, marketing e partner. Unit manager fica fora.
  // Enquanto o Loud Flow é só CRM da Franqueadora, roles sem acesso são
  // reencaminhadas pro login — não voltamos para "/" pra não cair em loop
  // com o redirect da home.
  const canOpen = session.role === "admin" || session.role === "marketing" || session.role === "partner";
  if (!canOpen) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [leadsRes, activitiesRes] = await Promise.all([
    supabase
      .from("franchise_leads")
      .select("*")
      .eq("organization_id", session.organizationId)
      .order("next_contact_at", { ascending: true, nullsFirst: false }),
    // Pré-carregamos o histórico das últimas 180 atividades para popular o
    // painel de detalhes sem round-trip extra ao abrir o lead. Volume baixo
    // nessa fase; refinamos se crescer.
    supabase
      .from("franchise_lead_activities")
      .select("*")
      .eq("organization_id", session.organizationId)
      .order("occurred_at", { ascending: false })
      .limit(180),
  ]);

  if (leadsRes.error) throw new Error(leadsRes.error.message);
  if (activitiesRes.error) throw new Error(activitiesRes.error.message);

  const leads = (leadsRes.data ?? []) as FranchiseLead[];
  const activities = (activitiesRes.data ?? []) as FranchiseLeadActivity[];

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Leads de franquia"
        description="Acompanhe quem precisa de retorno hoje, registre contatos e atualize a etapa de cada conversa."
      />
      <LeadsView
        leads={leads}
        activities={activities}
        role={session.role}
        nowIso={new Date().toISOString()}
      />
    </>
  );
}
