"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Result = { ok: boolean; message: string };

async function audit(action: string, campaignId: string, metadata: Record<string, unknown>) {
  const session = await requireAdmin();
  const admin = getSupabaseAdmin();
  await admin.from("audit_log").insert({
    organization_id: session.organizationId,
    actor_id: session.userId,
    action,
    target_type: "campaign",
    target_id: campaignId,
    metadata,
  });
}

export async function assignCampaignUnit(formData: FormData): Promise<Result> {
  const session = await requireAdmin();
  const campaignId = String(formData.get("campaign_id") ?? "");
  const unitRaw = String(formData.get("unit_id") ?? "").trim();
  if (!campaignId) return { ok: false, message: "Campanha inválida." };

  const admin = getSupabaseAdmin();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("id, organization_id, name")
    .eq("id", campaignId)
    .eq("organization_id", session.organizationId)
    .maybeSingle();
  if (!campaign) return { ok: false, message: "Campanha não encontrada." };

  if (unitRaw === "") {
    // "Nenhuma" — volta para unresolved e limpa unit_id.
    const { error } = await admin
      .from("campaigns")
      .update({ unit_id: null, unit_source: "unresolved" })
      .eq("id", campaignId)
      .eq("organization_id", session.organizationId);
    if (error) return { ok: false, message: error.message };
    await audit("campaign.unmap", campaignId, { name: campaign.name });
    revalidatePath("/config/campanhas");
    revalidatePath("/resultados");
    return { ok: true, message: "Mapeamento removido." };
  }

  const { data: unit } = await admin
    .from("units")
    .select("id, archived_at")
    .eq("id", unitRaw)
    .eq("organization_id", session.organizationId)
    .maybeSingle();
  if (!unit) return { ok: false, message: "Unidade inválida." };
  if (unit.archived_at) return { ok: false, message: "A unidade está arquivada." };

  const { error } = await admin
    .from("campaigns")
    .update({ unit_id: unitRaw, unit_source: "manual" })
    .eq("id", campaignId)
    .eq("organization_id", session.organizationId);
  if (error) return { ok: false, message: error.message };

  await audit("campaign.map", campaignId, { unit_id: unitRaw, name: campaign.name });
  revalidatePath("/config/campanhas");
  revalidatePath("/resultados");
  return { ok: true, message: "Mapeamento salvo." };
}
