import { ListChecks, LineChart, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/auth/labels";

export default async function HomePage() {
  const session = await requireSession();
  const firstName = (session.name ?? session.email).split(" ")[0].split("@")[0];

  return (
    <>
      <PageHeader
        eyebrow="Início"
        title={`Olá, ${firstName}.`}
        description="O Loud Flow ainda está sendo montado. Nesta versão você já tem acesso, seu perfil e a estrutura para as próximas fases."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-4 text-lf-muted" />
                Tarefas
              </CardTitle>
              <CardDescription>Kanban simples com prazo e responsável.</CardDescription>
            </div>
            <Badge variant="muted">Em breve</Badge>
          </CardHeader>
          <CardContent className="text-sm text-lf-muted">
            Chega na Fase 2. Você poderá criar tarefas por unidade, comentar e acompanhar tudo em um só lugar.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <LineChart className="size-4 text-lf-muted" />
                Resultados
              </CardTitle>
              <CardDescription>Painel diário puxado da UTMify.</CardDescription>
            </div>
            <Badge variant="muted">Em breve</Badge>
          </CardHeader>
          <CardContent className="text-sm text-lf-muted">
            Investimento, cliques, leads e checkouts por unidade e por campanha. Chega na Fase 3.
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-lf-volt" />
              Sua conta está pronta
            </CardTitle>
            <CardDescription>
              Perfil atual: <span className="text-foreground">{roleLabel(session.role)}</span>
              {" · "}
              Organização: <span className="text-foreground">{session.organizationName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-lf-muted">
            Se você é administrador, use <span className="text-foreground">Configurações</span> para
            convidar pessoas e organizar unidades. As demais páginas serão liberadas fase a fase.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
