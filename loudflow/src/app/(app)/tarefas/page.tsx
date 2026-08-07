import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shell/page-header";
import { formatTodayLong } from "@/lib/tasks/dates";
import { TasksView } from "./tasks-view";
import type { Task } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Tarefas" };
export const dynamic = "force-dynamic";

type Member = { id: string; email: string; name: string | null };
type UnitLite = { id: string; name: string };

export default async function TarefasPage() {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();
  const isAdmin = session.role === "admin";

  // Sempre carrega as tarefas do próprio usuário. Admin carrega em paralelo
  // as tarefas da equipe (RLS já permitiria, mas separamos para a UI decidir).
  const myPromise = supabase
    .from("tasks")
    .select("*")
    .eq("assigned_to", session.userId)
    .order("due_at", { ascending: true, nullsFirst: false });

  const teamPromise = isAdmin
    ? supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", session.organizationId)
        .order("due_at", { ascending: true, nullsFirst: false })
    : Promise.resolve({ data: [] as Task[], error: null });

  const membersPromise = isAdmin
    ? supabase
        .from("user_organizations")
        .select("user_id, users(id, email, name)")
        .eq("organization_id", session.organizationId)
    : Promise.resolve({ data: [], error: null });

  const unitsPromise = isAdmin
    ? supabase
        .from("units")
        .select("id, name, archived_at")
        .eq("organization_id", session.organizationId)
        .order("name", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [my, team, members, units] = await Promise.all([
    myPromise,
    teamPromise,
    membersPromise,
    unitsPromise,
  ]);

  if (my.error) throw new Error(my.error.message);
  if (team.error) throw new Error(team.error.message);

  const myTasks: Task[] = (my.data ?? []) as Task[];
  const teamTasks: Task[] = (team.data ?? []) as Task[];

  type MemberRow = { user_id: string; users: Member | null };
  const membersList: Member[] = ((members.data as MemberRow[] | null) ?? [])
    .filter((r) => r.users)
    .map((r) => r.users!)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  const unitsList: UnitLite[] = ((units.data as
    | { id: string; name: string; archived_at: string | null }[]
    | null) ?? [])
    .filter((u) => !u.archived_at)
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        eyebrow={formatTodayLong()}
        title="Minhas tarefas"
        description="Suas tarefas de hoje, o que está atrasado, o que vem a seguir e o que você já concluiu."
      />
      <TasksView
        currentUserId={session.userId}
        isAdmin={isAdmin}
        myTasks={myTasks}
        teamTasks={teamTasks}
        members={membersList}
        units={unitsList}
      />
    </>
  );
}
