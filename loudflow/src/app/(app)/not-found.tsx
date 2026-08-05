import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/states";

export default function NotFound() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="A página que você procurou não existe (ou ainda não foi construída)."
      action={
        <Button asChild>
          <Link href="/">Voltar para o início</Link>
        </Button>
      }
    />
  );
}
