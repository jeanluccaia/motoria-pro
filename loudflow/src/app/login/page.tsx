import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-lf-volt" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-widest text-lf-muted">
              Loud Flow
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-center text-sm text-lf-muted">
            Enviamos um link de acesso para o seu email.
          </p>
        </div>

        <LoginFormWrapper searchParams={searchParams} />

        <p className="mt-8 text-center text-xs text-lf-muted">
          Sistema privado da rede Loud Fit.
        </p>
      </div>
    </main>
  );
}

async function LoginFormWrapper({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  // Sanitiza `next` já no server para não vazar valor externo no HTML e
  // não dar tempo ao browser de agir num redirect malformado antes do
  // callback conferir de novo.
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  return <LoginForm next={next} />;
}
