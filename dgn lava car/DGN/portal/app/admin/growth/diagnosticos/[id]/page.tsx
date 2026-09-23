import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDiagnosticDetail } from "@/lib/growth/db/diagnostics-write";
import { getSupabaseAdminClient } from "@/lib/growth/db/admin-client";
import {
  DiagnosticFormServer,
  type DiagnosticServerDetail,
} from "@/components/growth/diagnostics/DiagnosticFormServer";
import type { InspectionCondition } from "@/lib/growth/diagnostics/catalog";

export const dynamic = "force-dynamic";

// Server component: hidrata o diagnostic + enriquece com customer/vehicle.
export default async function DiagnosticEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getDiagnosticDetail(id);
  if (!detail) notFound();

  // Enriquecer com customer + vehicle
  const supabase = getSupabaseAdminClient("crm.diagnostics-page");
  const [{ data: customerRow }, { data: vehicleRow }] = await Promise.all([
    supabase.from("crm_customers").select("id, name, primary_phone").eq("id", detail.customerId).maybeSingle(),
    supabase.from("crm_vehicles").select("id, brand, model, plate").eq("id", detail.vehicleId).maybeSingle(),
  ]);
  if (!customerRow || !vehicleRow) notFound();

  const initial: DiagnosticServerDetail = {
    id: detail.id,
    customer: {
      id: (customerRow as { id: string }).id,
      name: (customerRow as { name: string }).name,
      phone_masked: maskPhoneShallow((customerRow as { primary_phone: string | null }).primary_phone),
    },
    vehicle: {
      id: (vehicleRow as { id: string }).id,
      brand: (vehicleRow as { brand: string | null }).brand ?? "",
      model: (vehicleRow as { model: string | null }).model ?? "",
      plate: (vehicleRow as { plate: string | null }).plate ?? "",
    },
    status: detail.status,
    revision: detail.revision,
    catalog_version: detail.catalogVersion,
    performed_by: detail.performedBy,
    performed_at: detail.performedAt,
    summary: detail.summary,
    updated_at: detail.updatedAt,
    inspection_areas: normalizeAreas(detail.inspectionAreas),
    scores: normalizeScores(detail.scores),
    recommendations: normalizeRecommendations(detail.recommendations),
    investment_items: normalizeInvestment(detail.investmentItems),
  };

  return (
    <div className="min-h-dvh bg-[#050505]">
      <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/growth/diagnosticos"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-[#E7C96A]"
          >
            <ArrowLeft size={12} />
            Diagnósticos
          </Link>
        </div>
      </div>
      <DiagnosticFormServer initial={initial} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function maskPhoneShallow(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const last4 = digits.slice(-4);
  return `••••••${last4}`;
}

function normalizeAreas(raw: unknown[]): DiagnosticServerDetail["inspection_areas"] {
  return (raw as Array<Record<string, unknown>>).map((a) => ({
    area_key: String(a.area_key ?? ""),
    condition: (String(a.condition ?? "not_evaluated") as InspectionCondition),
    internal_notes: typeof a.internal_notes === "string" ? a.internal_notes : "",
    public_notes: typeof a.public_notes === "string" ? a.public_notes : "",
    public_visible: typeof a.public_visible === "boolean" ? a.public_visible : true,
  }));
}

function normalizeScores(raw: unknown[]): DiagnosticServerDetail["scores"] {
  return (raw as Array<Record<string, unknown>>).map((s) => ({
    criterion_key: String(s.criterion_key ?? ""),
    score: typeof s.score === "number" ? s.score : null,
  }));
}

function normalizeRecommendations(raw: unknown[]): DiagnosticServerDetail["recommendations"] {
  return (raw as Array<Record<string, unknown>>).map((r) => ({
    service_key: String(r.service_key ?? ""),
    catalog_version: String(r.catalog_version ?? ""),
    priority: String(r.priority ?? "recomendado"),
    reason: typeof r.reason === "string" ? r.reason : "",
  }));
}

function normalizeInvestment(raw: unknown[]): DiagnosticServerDetail["investment_items"] {
  return (raw as Array<Record<string, unknown>>).map((it) => ({
    service_key: String(it.service_key ?? ""),
    catalog_version: String(it.catalog_version ?? ""),
    catalog_reference_price_cents: Number(it.catalog_reference_price_cents ?? 0),
    base_price_cents: Number(it.base_price_cents ?? 0),
    discount_percent: Number(it.discount_percent ?? 0),
    installments: it.installments == null ? null : Number(it.installments),
    pix_eligible: Boolean(it.pix_eligible),
    note: typeof it.note === "string" ? it.note : "",
    override_reason: typeof it.override_reason === "string" ? it.override_reason : null,
  }));
}
