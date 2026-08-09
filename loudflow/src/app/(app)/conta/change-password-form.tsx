"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

function friendlyError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("password") && msg.includes("weak")) {
    return "Escolha uma senha mais forte (evite sequências e palavras óbvias).";
  }
  if (msg.includes("should be different") || msg.includes("same password")) {
    return "A nova senha precisa ser diferente da atual.";
  }
  if (msg.includes("session") || msg.includes("jwt")) {
    return "Sua sessão expirou. Entre novamente para trocar a senha.";
  }
  return raw || "Não foi possível trocar a senha agora.";
}

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setState({
        kind: "error",
        message: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      });
      return;
    }
    if (password !== confirm) {
      setState({ kind: "error", message: "As senhas digitadas não conferem." });
      return;
    }

    setState({ kind: "loading" });
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState({ kind: "error", message: friendlyError(error.message ?? "") });
      return;
    }
    setState({ kind: "ok" });
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={state.kind === "loading"}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar senhas" : "Mostrar senhas"}
            aria-pressed={show}
            className={cn(
              "absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r text-lf-muted",
              "hover:text-foreground focus-visible:text-foreground lf-focus",
            )}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirme a nova senha</Label>
        <Input
          id="confirm-password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          placeholder="Repita a nova senha"
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
      {state.kind === "ok" ? (
        <p role="status" className="text-sm text-emerald-500">
          Senha atualizada. Use a nova senha da próxima vez que entrar.
        </p>
      ) : null}

      <Button type="submit" disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Salvando..." : "Trocar senha"}
      </Button>
    </form>
  );
}
