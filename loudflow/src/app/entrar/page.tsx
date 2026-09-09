import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getQuickAccessEmails } from "@/lib/auth/quick-access";
import { QuickPicker } from "./quick-picker";
import loudfitLockup from "@/../public/brand/loudfit-lockup.png";

export const metadata: Metadata = { title: "Entrar" };

// Entrada rápida por seleção de nome — sem senha. Só existe pra os
// e-mails listados em LOUDFLOW_QUICK_ACCESS_EMAILS (allowlist). Se a
// env estiver vazia, redireciona pro /login clássico.
//
// Uma vez selecionado, POST /api/auth/quick cria a sessão do usuário
// via generateLink+verifyOtp (magiclink consumido internamente). Os
// cookies sb-* ficam no navegador; próxima visita nem passa por aqui.
export default async function EntrarPage() {
  const emails = getQuickAccessEmails();
  if (emails.length === 0) redirect("/login");

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("users")
    .select("id,email,name")
    .in("email", emails);

  const users = (data ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: (u.name && u.name !== u.email ? u.name : u.email.split("@")[0])!,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
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
            Escolha seu nome
          </h1>
        </div>

        <QuickPicker users={users} />

        <p className="mt-8 text-center text-xs text-lf-muted">
          Sistema privado da rede Loud Fit.
        </p>
      </div>
    </main>
  );
}
