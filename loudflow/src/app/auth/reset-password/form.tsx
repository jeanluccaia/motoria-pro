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
  | { kind: "error"; message: string }
  | { kind: "success" };

const MIN_LEN = 10;

// Regras cliente: usadas apenas para feedback imediato. A validação
// canônica roda em /api/auth/set-password (server) para não confiar
// no browser.
function localValidate(pw: string, confirm: string): string | null {
  if (pw.length < MIN_LEN) return `Use no mínimo ${MIN_LEN} caracteres.`;
  if (pw !== confirm) return "As senhas não conferem.";
  return null;
}

function friendlyError(code: string | undefined): string {
  switch (code) {
    case "weak_password":
      return `Escolha uma senha com no mínimo ${MIN_LEN} caracteres.`;
    case "session_missing":
      return "Sessão de recuperação expirou. Peça um novo link ao administrador.";
    case "invalid_request":
      return "Preencha a senha e a confirmação.";
    case "same_as_old":
      return "A nova senha precisa ser diferente da anterior.";
    default:
      return "Não foi possível definir a senha agora. Tente novamente.";
  }
}

export function ResetPasswordForm() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const local = localValidate(pw, confirm);
    if (local) {
      setState({ kind: "error", message: local });
      return;
    }
    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setState({ kind: "error", message: friendlyError(data.error) });
        return;
      }
    } catch {
      setState({ kind: "error", message: friendlyError("network") });
      return;
    }

    setState({ kind: "success" });
    // Full navigation — cookies de sessão foram atualizados no set-password.
    window.location.assign("/");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_LEN}
            placeholder="Mínimo 10 caracteres"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            disabled={state.kind === "loading"}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={show}
            className={cn(
              "absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r text-lf-muted",
              "hover:text-foreground focus-visible:text-foreground lf-focus",
            )}
          >
            {show ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_LEN}
          placeholder="Repita a senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={state.kind === "loading"}
        />
      </div>

      {state.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.kind === "success" ? (
        <p role="status" className="text-sm text-lf-muted">
          Senha atualizada. Entrando…
        </p>
      ) : null}

      <Button type="submit" disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Salvando..." : "Salvar senha"}
      </Button>
    </form>
  );
}
