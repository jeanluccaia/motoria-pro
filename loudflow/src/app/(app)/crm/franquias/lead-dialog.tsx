"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  SOURCE_LABELS,
  SOURCE_ORDER,
} from "@/lib/crm/labels";
import { utcIsoToBrtInput } from "@/lib/crm/dates";
import { createLead, updateLead } from "./actions";
import type { FranchiseLead, Role } from "@/lib/supabase/types";

type Props =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (o: boolean) => void;
      role: Role;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (o: boolean) => void;
      role: Role;
      lead: FranchiseLead;
    };

export function LeadDialog(props: Props) {
  const { mode, open, onOpenChange } = props;
  const lead = mode === "edit" ? props.lead : null;

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [stage, setStage] = useState(lead?.pipeline_stage ?? "new");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setMoreOpen(false);
      if (mode === "create") setStage("new");
    }
    onOpenChange(nextOpen);
  }

  function onSubmit(formData: FormData) {
    setError(null);
    if (lead) formData.set("id", lead.id);
    startTransition(async () => {
      const r = mode === "create" ? await createLead(formData) : await updateLead(formData);
      if (r.ok) {
        handleOpenChange(false);
      } else {
        setError(r.message);
      }
    });
  }

  const title = mode === "create" ? "Adicionar lead" : "Editar lead";
  const description =
    mode === "create"
      ? "Preencha o essencial. Nome e celular são obrigatórios. Os demais campos ficam dentro de “Mais informações”."
      : "Ajuste os dados do lead. As alterações valem imediatamente para a equipe.";
  const submitLabel = mode === "create" ? "Cadastrar lead" : "Salvar alterações";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-5 sm:p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="flex min-h-0 flex-col gap-4">
          <div className="grid min-h-0 gap-4 overflow-y-auto pr-1">
            <div className="grid gap-1.5">
              <Label htmlFor="lead-name">Nome</Label>
              <Input
                id="lead-name"
                name="full_name"
                required
                defaultValue={lead?.full_name ?? ""}
                placeholder="Ex.: Camilla Souza"
                disabled={pending}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-phone">Celular</Label>
                <Input
                  id="lead-phone"
                  name="phone"
                  required
                  defaultValue={lead?.phone ?? ""}
                  placeholder="(19) 99755-5366"
                  disabled={pending}
                />
                <p className="text-xs text-lf-muted">Se faltar um dígito, a gente avisa — não bloqueia o cadastro.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  name="email"
                  type="email"
                  defaultValue={lead?.email ?? ""}
                  placeholder="opcional"
                  disabled={pending}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-source">Origem</Label>
                <select
                  id="lead-source"
                  name="source"
                  defaultValue={lead?.source ?? ""}
                  disabled={pending}
                  className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
                >
                  <option value="">Não informada</option>
                  {SOURCE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-received">Data de recebimento</Label>
                <Input
                  id="lead-received"
                  name="received_at"
                  type="datetime-local"
                  defaultValue={lead ? utcIsoToBrtInput(lead.received_at) : ""}
                  disabled={pending}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-stage">Etapa</Label>
                <select
                  id="lead-stage"
                  name="pipeline_stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as typeof stage)}
                  disabled={pending}
                  className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
                >
                  {STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-priority">Prioridade</Label>
                <select
                  id="lead-priority"
                  name="priority"
                  defaultValue={lead?.priority ?? "normal"}
                  disabled={pending}
                  className="h-10 rounded-md border border-input bg-lf-graphite px-3 text-sm text-foreground lf-focus"
                >
                  {PRIORITY_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-next-action">Próxima ação</Label>
                <Input
                  id="lead-next-action"
                  name="next_action"
                  defaultValue={lead?.next_action ?? ""}
                  placeholder="Ex.: Ligar hoje à tarde"
                  disabled={pending}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-next-contact">Data do próximo contato</Label>
                <Input
                  id="lead-next-contact"
                  name="next_contact_at"
                  type="datetime-local"
                  defaultValue={lead ? utcIsoToBrtInput(lead.next_contact_at) : ""}
                  disabled={pending}
                />
              </div>
            </div>

            {stage === "lost" ? (
              <div className="grid gap-1.5">
                <Label htmlFor="lead-lost-reason">Motivo da perda</Label>
                <Input
                  id="lead-lost-reason"
                  name="lost_reason"
                  required
                  defaultValue={lead?.lost_reason ?? ""}
                  placeholder="Ex.: Fechou com concorrente"
                  disabled={pending}
                />
              </div>
            ) : null}

            <details
              className="rounded-md border border-border/80 bg-lf-graphite/40 p-3"
              open={moreOpen || Boolean(lead?.investment_range || lead?.start_timeline || lead?.whatsapp_label || lead?.notes)}
              onToggle={(e) => setMoreOpen((e.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer select-none text-sm font-medium text-foreground">
                Mais informações
              </summary>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="lead-investment">Investimento disponível</Label>
                    <Input
                      id="lead-investment"
                      name="investment_range"
                      defaultValue={lead?.investment_range ?? ""}
                      placeholder="Ex.: De R$ 700 mil a R$ 899 mil"
                      disabled={pending}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="lead-timeline">Prazo para iniciar</Label>
                    <Input
                      id="lead-timeline"
                      name="start_timeline"
                      defaultValue={lead?.start_timeline ?? ""}
                      placeholder="Ex.: Até 3 meses"
                      disabled={pending}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lead-wa">Identificação no WhatsApp</Label>
                  <Input
                    id="lead-wa"
                    name="whatsapp_label"
                    defaultValue={lead?.whatsapp_label ?? ""}
                    placeholder="Ex.: ~Fabio"
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lead-notes">Observações</Label>
                  <textarea
                    id="lead-notes"
                    name="notes"
                    rows={3}
                    defaultValue={lead?.notes ?? ""}
                    placeholder="Qualquer informação adicional"
                    disabled={pending}
                    className="min-h-24 w-full rounded-md border border-input bg-lf-graphite px-3 py-2 text-sm text-foreground placeholder:text-lf-muted lf-focus disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </details>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-border/80 pt-4">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
