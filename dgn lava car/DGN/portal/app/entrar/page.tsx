import type { Metadata } from "next";
import { EntrarForm } from "./entrar-form";

export const metadata: Metadata = {
  title: "Entrar — DGN Club",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}

export default async function EntrarPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dgn-clean.png"
          alt="DGN Club"
          width={640}
          height={211}
          className="h-14 w-auto select-none"
          draggable={false}
        />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Área do Assinante</h1>
          <p className="text-sm text-white/70">
            Enviamos um link de acesso para o e-mail cadastrado na sua assinatura.
          </p>
        </div>
      </header>

      {sent ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-100">
          <p className="font-medium">Se este e-mail está cadastrado, o link chegou.</p>
          <p className="mt-2 text-emerald-100/80">
            Abra sua caixa de entrada e clique em <em>Entrar no DGN Club</em>.
            O link expira em pouco tempo, por segurança.
          </p>
        </div>
      ) : (
        <EntrarForm nextPath={nextPath} />
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-200">
          {decodeErrorLabel(error)}
        </p>
      )}

      <footer className="text-center text-[11px] text-white/40">
        Acesso restrito a assinantes DGN Club. Se ainda não é assinante,
        fale com a equipe para receber seu convite.
      </footer>
    </main>
  );
}

function decodeErrorLabel(err: string): string {
  if (err === "invalid_link") return "Link inválido ou expirado. Peça um novo abaixo.";
  if (err === "not_linked") return "E-mail sem vínculo com assinatura. Fale com a equipe DGN.";
  if (err === "callback_failed") return "Não foi possível concluir o login. Tente novamente.";
  return "Não conseguimos concluir o login. Tente novamente.";
}
