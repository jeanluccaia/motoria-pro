"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

// Traduz o código de erro estável do /api/auth/signin para uma
// mensagem humana. A rota nunca devolve a string crua do GoTrue —
// aqui traduzimos para pt-BR.
function friendlyError(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "invalid_request":
      return "Preencha e-mail e senha para entrar.";
    default:
      return "Não foi possível entrar agora. Tente novamente em instantes.";
  }
}

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setState({ kind: "loading" });

    let ok = false;
    let errorCode: string | undefined;
    let redirect = next;
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `next` já vem sanitizado do server component pai. A rota
        // roda safeNext de novo — defesa em profundidade.
        body: JSON.stringify({ email: email.trim(), password, next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirect?: string;
      };
      ok = res.ok && Boolean(data.ok);
      errorCode = data.error;
      if (ok && typeof data.redirect === "string") redirect = data.redirect;
    } catch {
      errorCode = "network";
    }

    if (!ok) {
      setState({ kind: "error", message: friendlyError(errorCode) });
      return;
    }

    // Full navigation em vez de router.push: os cookies do Supabase
    // já foram gravados na resposta do POST; queremos um GET novo que
    // passe pelo proxy e renderize a página autenticada com a sessão
    // aplicada.
    window.location.assign(redirect);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="voce@loudfit.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state.kind === "loading"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={state.kind === "loading"}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className={cn(
              "absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r text-lf-muted",
              "hover:text-foreground focus-visible:text-foreground lf-focus",
            )}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {state.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-xs text-lf-muted">
        Esqueceu a senha? Fale com um administrador.
      </p>
    </form>
  );
}
