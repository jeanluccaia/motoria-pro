"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  buildEmailRedirectTo,
  NEXT_COOKIE,
  safeNext,
} from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

// Duração do cookie de destino do Magic Link. Alinhado com o TTL padrão
// de 1h dos links do Supabase — não faz sentido persistir mais tempo.
const NEXT_COOKIE_MAX_AGE_SECONDS = 60 * 60;

// Mensagem exibida quando o e-mail informado não está cadastrado. Como
// usamos `shouldCreateUser: false`, o Supabase devolve um erro genérico
// (`Signups not allowed for otp`) — a UI traduz para algo humano.
const UNKNOWN_USER_MESSAGE =
  "Este e-mail não tem acesso ao Loud Flow. Peça a um administrador para liberar seu cadastro.";

function persistNextCookie(next: string) {
  // O cookie é lido pelo Server em /auth/confirm — não precisa ser
  // HttpOnly (setado do client não pode ser HttpOnly de qualquer forma).
  // SameSite=Lax permite que o link no e-mail (top-level GET) traga o
  // cookie de volta, mas bloqueia cross-site XHR.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${NEXT_COOKIE}=${encodeURIComponent(next)}; ` +
    `Path=/; Max-Age=${NEXT_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setState({ kind: "loading" });

    // Origem sempre vem de `window.location.origin` — o mesmo deployment
    // que o usuário abriu no navegador (Preview, produção ou local).
    // Nunca dependemos de NEXT_PUBLIC_APP_URL: uma env local com
    // localhost faria o link do e-mail chegar apontando para localhost
    // mesmo em Preview. `buildEmailRedirectTo` devolve só a origem bare;
    // o template do Supabase concatena `/auth/confirm?token_hash=...`.
    const redirectTo = buildEmailRedirectTo(window.location.origin);

    // Preservamos o destino num cookie *deste* browser. Se o usuário
    // abre o link no mesmo device, o cookie sobrevive e o /auth/confirm
    // envia direto para lá. Se abrir em outro (celular ↔ desktop, Mail
    // WebView, etc.) o cookie não existe e cai no DEFAULT_NEXT — a
    // sessão continua sendo criada, só o destino é o padrão.
    persistNextCookie(safeNext(next));

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        // Só usuários já cadastrados podem entrar. Isso evita que um
        // e-mail digitado errado receba um link e vire uma conta órfã
        // sem organização.
        shouldCreateUser: false,
      },
    });

    if (error) {
      const raw = error.message ?? "";
      const isUnknownUser =
        /signups?\s+not\s+allowed/i.test(raw) ||
        /user\s+not\s+found/i.test(raw);
      setState({
        kind: "error",
        message: isUnknownUser ? UNKNOWN_USER_MESSAGE : raw,
      });
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
          Abra seu email e clique no link para entrar. O link expira em 1 hora
          e só pode ser usado uma vez.
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
