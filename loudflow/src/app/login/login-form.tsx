"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildEmailRedirectTo } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setState({ kind: "loading" });

    const supabase = createSupabaseBrowserClient();
    // Origem sempre vem de `window.location.origin` — o mesmo deployment
    // que o usuário abriu no navegador (Preview, produção ou local).
    // Nunca dependemos de NEXT_PUBLIC_APP_URL: uma env local com localhost
    // faria o Magic Link chegar apontando para localhost mesmo em Preview.
    // `next` é sanitizado por `buildEmailRedirectTo` para evitar que a query
    // string vire uma URL externa quando o Supabase reencaminhar para nós.
    const redirectTo = buildEmailRedirectTo(window.location.origin, next);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });

    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    setState({ kind: "sent", email: email.trim() });
  }

  if (state.kind === "sent") {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-foreground">
          Enviamos um link para <span className="font-medium">{state.email}</span>.
        </p>
        <p className="mt-2 text-xs text-lf-muted">
          Abra seu email e clique no link para entrar. O link expira em 1 hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@loudfit.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state.kind === "loading"}
        />
      </div>
      {state.kind === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Enviando..." : "Enviar link de acesso"}
      </Button>
    </form>
  );
}
