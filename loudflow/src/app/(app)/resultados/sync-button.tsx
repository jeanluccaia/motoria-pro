"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncUtmifyNow } from "./actions";

// Botão "Sincronizar agora" — só rendrizado para admin (o pai decide).
// Bloqueia cliques duplicados via `useTransition` + estado local `pending`.
export function SyncButton({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(true);

  const disabled = pending || !configured;
  const title = !configured
    ? "UTMify não configurada — peça ao administrador para preencher UTMIFY_*."
    : "Sincroniza o dia anterior fechado.";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        title={title}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await syncUtmifyNow();
            setOk(result.ok);
            setMessage(result.message);
          });
        }}
        className="gap-2"
      >
        <RefreshCw className={"size-4 " + (pending ? "animate-spin" : "")} />
        {pending ? "Sincronizando…" : "Sincronizar agora"}
      </Button>
      {message ? (
        <p
          role="status"
          className={
            "text-xs " + (ok ? "text-lf-muted" : "text-destructive")
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
