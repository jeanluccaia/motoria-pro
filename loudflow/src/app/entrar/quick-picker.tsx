"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type QuickUser = { id: string; email: string; name: string };

export function QuickPicker({ users }: { users: QuickUser[] }) {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(email: string) {
    setLoadingEmail(email);
    setError(null);
    let ok = false;
    let redirect = "/";
    try {
      const res = await fetch("/api/auth/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        redirect?: string;
      };
      ok = res.ok && Boolean(data.ok);
      if (ok && typeof data.redirect === "string") redirect = data.redirect;
    } catch {
      // rede offline — cai no error abaixo
    }

    if (!ok) {
      setLoadingEmail(null);
      setError("Não deu pra entrar agora. Tente de novo em instantes.");
      return;
    }

    // Full navigation pra o GET da home passar pelo proxy com a sessão
    // recém-gravada nos cookies.
    window.location.assign(redirect);
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-sm text-lf-muted">
        Nenhum sócio liberado. Fale com o administrador.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((u) => (
        <Button
          key={u.id}
          type="button"
          variant="secondary"
          className="h-14 justify-start text-base font-semibold"
          onClick={() => pick(u.email)}
          disabled={loadingEmail !== null}
        >
          {loadingEmail === u.email ? "Entrando…" : u.name}
        </Button>
      ))}
      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
