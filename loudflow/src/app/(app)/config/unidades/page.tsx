import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shell/states";
import { NewUnitForm } from "./new-unit-form";
import { UnitsList } from "./units-list";
import type { Unit } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("organization_id", session.organizationId)
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  const units: Unit[] = data ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Nova unidade
        </h2>
        <NewUnitForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Unidades da rede
        </h2>
        {units.length === 0 ? (
          <EmptyState
            title="Nenhuma unidade cadastrada"
            description="Crie a primeira acima para começar."
          />
        ) : (
          <UnitsList units={units} />
        )}
      </section>
    </div>
  );
}
