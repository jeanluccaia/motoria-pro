"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserSupabase } from "@/lib/portal/supabase-browser";

interface Props {
  nextPath: string;
}

export function EntrarForm({ nextPath }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError("Informe um e-mail válido.");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = browserSupabase();
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { error: err } = await supabase.auth.signInWithOtp({
          email: cleaned,
          options: {
            emailRedirectTo,
            shouldCreateUser: false,
          },
        });
        if (err) {
          // Não vaza se o e-mail existe ou não. Sempre mostra sucesso genérico.
          console.warn("[entrar] signInWithOtp warning:", err.message);
        }
        const params = new URLSearchParams(searchParams);
        params.set("sent", "1");
        router.replace(`/entrar?${params.toString()}`);
      } catch {
        setError("Não foi possível enviar o link. Tente novamente em alguns segundos.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-[0.24em] text-white/60">
          Seu e-mail
        </span>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10"
          placeholder="voce@email.com"
          disabled={pending}
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Receber acesso"}
      </button>

      <p className="text-[11px] leading-relaxed text-white/40">
        Enviamos um link seguro. Você não precisa criar senha. O acesso é
        individual e liberado somente para o e-mail já cadastrado como
        assinante DGN Club.
      </p>
    </form>
  );
}
