"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";

// Botão de teste: cria um rascunho real via POST + Idempotency-Key,
// e redireciona pra /admin/growth/diagnosticos/[id]. Usado APENAS para
// homologação da Entrega 1 na Supabase branch — as fixtures ficam
// hardcoded aqui de propósito (customer/vehicle de teste na branch).

export function NewDiagnosticButton({
  customerId,
  vehicleId,
  catalogVersion,
  performedBy,
  label,
  disabled,
  disabledReason,
}: {
  customerId: string;
  vehicleId: string;
  catalogVersion: string;
  performedBy: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // Idempotency-Key único por click — se o usuário der refresh e clicar
      // de novo, uma NOVA chave é gerada (POST cria novo diag). Se a mesma
      // chave for reenviada (retry programático), o server devolve replay.
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const res = await fetch(
        `/api/admin/growth/customers/${encodeURIComponent(customerId)}/diagnostics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            vehicle_id: vehicleId,
            catalog_version: catalogVersion,
            performed_by: performedBy,
          }),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        diagnostic_id?: string;
        error?: { code?: string; message?: string };
      };
      if (!res.ok || !body.diagnostic_id) {
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      router.push(`/admin/growth/diagnosticos/${encodeURIComponent(body.diagnostic_id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha desconhecida");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading || disabled}
        title={disabled ? disabledReason : undefined}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
        {label}
      </button>
      {error ? (
        <p className="text-[11px] text-red-200">Falha ao criar: {error}</p>
      ) : null}
    </div>
  );
}
