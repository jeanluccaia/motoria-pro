import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aguardando liberação" };

export default async function PendingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membership) redirect("/");

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="size-2 bg-lf-volt" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-widest text-lf-muted">
            Loud Flow
          </span>
        </div>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">
          Acesso aguardando liberação
        </h1>
        <p className="mb-8 text-sm text-lf-muted">
          <span className="text-foreground">{user.email}</span> ainda não está vinculada a
          nenhuma organização. Peça a um administrador da rede para liberar seu acesso e
          entre novamente.
        </p>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-xs uppercase tracking-widest text-lf-muted underline underline-offset-4 hover:text-foreground"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
