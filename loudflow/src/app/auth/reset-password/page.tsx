import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import loudfitLockup from "@/../public/brand/loudfit-lockup.png";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = { title: "Definir senha" };

export default async function ResetPasswordPage() {
  // Só quem tem sessão de recovery/invite chega aqui — o /api/auth/callback
  // gravou os cookies antes de redirecionar. Sem sessão, manda para /login.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?err=link_invalid");

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-4">
          <Image
            src={loudfitLockup}
            alt="Loud Fit"
            priority
            className="h-12 w-auto"
            sizes="180px"
          />
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-lf-muted">
            Loud Flow
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Definir senha
          </h1>
          <p className="text-center text-sm text-lf-muted">
            Escolha uma senha para <span className="text-foreground">{user.email}</span>.
            Mínimo 10 caracteres.
          </p>
        </div>

        <ResetPasswordForm />

        <p className="mt-8 text-center text-xs text-lf-muted">
          Sistema privado da rede Loud Fit.
        </p>
      </div>
    </main>
  );
}
