import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shell/states";
import { UsersList } from "./_users/users-list";
import { InviteUserForm } from "./_users/invite-form";
import { roleLabel } from "@/lib/auth/labels";
import type { Role } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Row = {
  user_id: string;
  role: Role;
  users: { id: string; email: string; name: string | null } | null;
};

export default async function UsersPage() {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_organizations")
    .select("user_id, role, users(id, email, name)")
    .eq("organization_id", session.organizationId)
    .order("role", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows: Row[] = (data ?? []) as Row[];
  const users = rows
    .filter((r) => r.users)
    .map((r) => ({
      id: r.users!.id,
      email: r.users!.email,
      name: r.users!.name,
      role: r.role,
      roleLabel: roleLabel(r.role),
    }));

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Convidar novo usuário
        </h2>
        <InviteUserForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-lf-muted">
          Pessoas com acesso
        </h2>
        {users.length === 0 ? (
          <EmptyState
            title="Ninguém aqui ainda"
            description="Convide alguém acima para começar. O convite envia um link por email."
          />
        ) : (
          <UsersList users={users} currentUserId={session.userId} />
        )}
      </section>
    </div>
  );
}
