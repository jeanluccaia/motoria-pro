import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTEGRATION_UNAVAILABLE_REASON } from "@/lib/integrations/utmify/env";

// Botão "Sincronizar agora" — renderizado apenas para admin.
//
// Nesta versão a sincronização automática está indisponível (contrato HTTP
// oficial da UTMify para leitura de métricas ainda não confirmado). O botão
// aparece desabilitado com a explicação por baixo — deixa o admin ciente
// da limitação sem prometer uma ação que ainda não funciona.
export function SyncButton() {
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        title={INTEGRATION_UNAVAILABLE_REASON}
        className="gap-2"
      >
        <RefreshCw className="size-4" />
        Sincronizar agora
      </Button>
      <p role="status" className="max-w-xs text-right text-xs text-lf-muted">
        {INTEGRATION_UNAVAILABLE_REASON}
      </p>
    </div>
  );
}
