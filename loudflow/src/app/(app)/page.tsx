import Link from "next/link";
import { ArrowRight, ListChecks, LineChart, Sparkles } from "lucide-react";
import { requireSession, type Session } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { roleLabel } from "@/lib/auth/labels";

// Primeiro nome do usuário. Preferência: session.name (primeira
// palavra, capitalizada). Fallback: parte local do e-mail antes do @,
// dividida por `.`/`_`/`-`, capitalizada. Evita a saudação feia
// "Olá, jean.lucca." quando o nome ainda não foi preenchido.
function firstNameFrom(session: Session): string {
  const name = session.name?.trim();
  if (name && name.length > 0) {
    return capitalize(name.split(/\s+/)[0]);
  }
  const local = session.email.split("@")[0] ?? "";
  const head = local.split(/[._\-]/)[0] || local;
  return capitalize(head);
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word[0].toLocaleUpperCase("pt-BR") + word.slice(1).toLocaleLowerCase("pt-BR");
}

export default async function HomePage() {
  const session = await requireSession();
  const firstName = firstNameFrom(session);

  return (
    <>
      <PageHeader
        eyebrow="Início"
        title={`Olá, ${firstName}.`}
        description="Centralize as tarefas da operação e acompanhe as prioridades da Loud Fit em um só lugar."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tarefas — módulo disponível. Card inteiro clicável, com
            acento amarelo sutil da Loud Fit e hover premium. */}
        <Link
          href="/tarefas"
          aria-label="Abrir tarefas"
          className="group block rounded-lg border border-border bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-lf-volt/70 hover:shadow-[0_10px_30px_-15px_rgba(255,224,0,0.35)] lf-focus"
        >
          <div className="flex flex-col gap-1.5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-lf-volt" aria-hidden />
                <h3 className="text-lg font-semibold leading-none">Tarefas</h3>
              </div>
              <span
                className="inline-flex items-center rounded-md border border-lf-volt/40 bg-lf-volt/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-lf-volt"
                aria-label="módulo disponível"
              >
                Disponível
              </span>
            </div>
            <p className="text-sm text-lf-muted">
              Organize, acompanhe e conclua as prioridades da operação.
            </p>
          </div>
          <div className="p-6 pt-0 text-sm">
            <span className="inline-flex items-center gap-2 text-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5">
              Ver tarefas <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </Link>

        {/* Resultados — módulo disponível. Mesmo tratamento visual do
            card Tarefas: card inteiro clicável, ícone/badge amarelo
            Loud Fit, hover premium e discreto. */}
        <Link
          href="/resultados"
          aria-label="Abrir resultados"
          className="group block rounded-lg border border-border bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-lf-volt/70 hover:shadow-[0_10px_30px_-15px_rgba(255,224,0,0.35)] lf-focus"
        >
          <div className="flex flex-col gap-1.5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="flex items-center gap-2 text-lg font-semibold leading-none">
                  <LineChart className="size-4 text-lf-volt" aria-hidden />
                  Resultados
                </h3>
                <p className="text-sm text-lf-muted">Painel diário puxado da UTMify.</p>
              </div>
              <span
                className="inline-flex items-center rounded-md border border-lf-volt/40 bg-lf-volt/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-lf-volt"
                aria-label="módulo disponível"
              >
                Disponível
              </span>
            </div>
            <p className="text-sm text-lf-muted">
              Acompanhe investimento, cliques, leads e checkouts por unidade e campanha.
            </p>
          </div>
          <div className="p-6 pt-0 text-sm">
            <span className="inline-flex items-center gap-2 text-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5">
              Ver resultados <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </Link>

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
