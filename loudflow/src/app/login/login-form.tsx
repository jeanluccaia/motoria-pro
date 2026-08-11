"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "reset-sent" };

// Traduz o código de erro estável do /api/auth/signin (e do callback
// via ?err=) para uma mensagem humana em pt-BR. A rota nunca devolve
// a string crua do GoTrue e a URL nunca revela existência de e-mail.
function friendlyError(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "invalid_request":
      return "Preencha e-mail e senha para entrar.";
    case "link_expired":
      return "O link expirou. Peça um novo ao administrador ou use \"Esqueci minha senha\".";
    case "link_invalid":
      return "Link inválido. Use \"Esqueci minha senha\" para receber um novo.";
    case "network":
      return "Sem conexão. Verifique sua internet e tente de novo.";
    case "rate_limited":
      return "Muitas tentativas seguidas. Aguarde um minuto e tente novamente.";
    default:
      return "Não foi possível entrar agora. Tente novamente em instantes.";
  }
}

export function LoginForm({ next, initialError }: { next: string; initialError?: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<State>(
    initialError ? { kind: "error", message: friendlyError(initialError) } : { kind: "idle" },
  );
  const [showReset, setShowReset] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Se veio ?err=... na URL, exibe uma vez e limpa da barra do browser
  // para não ficar teimando com a mesma mensagem após retry.
  useEffect(() => {
    if (!initialError) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("err")) {
      url.searchParams.delete("err");
      window.history.replaceState({}, "", url.toString());
    }
  }, [initialError]);

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
        body: JSON.stringify({ email: email.trim(), password, next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirect?: string;
      };
      ok = res.ok && Boolean(data.ok);
      errorCode = data.error;
      if (res.status === 429) errorCode = "rate_limited";
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

  async function onRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = email.trim();
    if (!target) {
      setState({ kind: "error", message: "Informe o e-mail antes de solicitar o reset." });
      return;
    }
    setResetSubmitting(true);
    try {
      await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
    } catch {
      // A resposta é sempre "ok" (não vazamos existência do e-mail),
      // então erro de rede também vira o mesmo estado neutro.
    }
    setResetSubmitting(false);
    setState({ kind: "reset-sent" });
  }

  return (
    <div className="flex flex-col gap-4">
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
        {state.kind === "reset-sent" ? (
          <p role="status" className="text-sm text-lf-muted">
            Se este e-mail está autorizado, você receberá um link para definir a senha.
            Verifique sua caixa de entrada ou fale com o administrador.
          </p>
        ) : null}

        <Button type="submit" disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="text-center">
        {showReset ? (
          <form onSubmit={onRequestReset} className="flex flex-col gap-2 items-center">
            <p className="text-xs text-lf-muted">
              Vamos enviar um link para o e-mail acima. Confirme abaixo.
            </p>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" disabled={resetSubmitting}>
                {resetSubmitting ? "Enviando..." : "Enviar link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowReset(false)}
                disabled={resetSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-xs text-lf-muted underline underline-offset-4 hover:text-foreground lf-focus"
          >
            Esqueci minha senha
          </button>
        )}
      </div>
    </div>
  );
}
