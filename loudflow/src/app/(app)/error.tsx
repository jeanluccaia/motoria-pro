"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shell/states";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Não conseguimos carregar esta página"
      description={
        error.message?.includes("Missing env")
          ? "As credenciais do Supabase não estão configuradas. Copie .env.example para .env.local e preencha."
          : "Tente novamente em alguns segundos. Se persistir, avise um administrador."
      }
      action={
        <Button variant="outline" onClick={reset}>
          Tentar de novo
        </Button>
      }
    />
  );
}
