"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Pencil,
  PhoneCall,
  GitBranch,
  CalendarPlus,
  Clock,
  MessageSquare,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  stageBadgeClass,
  priorityBadgeClass,
} from "@/lib/crm/labels";
import { formatDateTime, utcIsoToBrtInput, brtInputToUtcIso } from "@/lib/crm/dates";
import { formatPhoneForDisplay } from "@/lib/crm/phone";
import {
  calculateLeadIntelligence,
  waNumberFor,
  type LeadIntelligence,
  type AttentionLevel,
} from "@/lib/crm/intelligence";
import { LeadDialog } from "./lead-dialog";
import { registerContact, scheduleNextContact, changeStage } from "./actions";
import type {
  FranchiseLead,
  FranchiseLeadActivity,
  FranchiseLeadStage,
  Role,
} from "@/lib/supabase/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: FranchiseLead;
  activities: FranchiseLeadActivity[];
  intelligence?: LeadIntelligence | null;
  role: Role;
};

function attentionBadgeClass(level: AttentionLevel): string {
  switch (level) {
    case "critical":
      return "bg-rose-500/15 text-rose-200 border-rose-500/50";
    case "today":
      return "bg-amber-500/15 text-amber-200 border-amber-500/40";
    case "soon":
      return "bg-sky-500/15 text-sky-200 border-sky-500/30";
    case "monitor":
      return "bg-neutral-500/15 text-neutral-200 border-neutral-500/30";
    case "none":
    default:
      return "bg-neutral-500/10 text-neutral-300 border-neutral-500/20";
  }
}

type ActionMode = "none" | "contact" | "stage" | "schedule";

export function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  activities,
  intelligence,
  role,
}: Props) {
  const canEditCadastro = role === "admin" || role === "marketing";
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<ActionMode>("none");

  const activityLabels: Record<FranchiseLeadActivity["activity_type"], string> = {
    contact: "Contato",
    stage_change: "Etapa",
    schedule: "Agenda",
    note: "Observação",
  };

  // Recalcula a inteligência localmente para refletir mudanças que já voltaram
  // do servidor (ex: usuário acabou de registrar um contato). Determinístico,
  // sem round-trip.
  const intel = useMemo<LeadIntelligence>(() => {
    if (intelligence) return intelligence;
    return calculateLeadIntelligence(lead, activities, new Date());
  }, [intelligence, lead, activities]);

  const wa = waNumberFor(lead);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    [activities],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-5 sm:p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>{lead.full_name}</span>
              <Badge
                variant="outline"
                className={cn("normal-case tracking-normal", stageBadgeClass(lead.pipeline_stage))}
              >
                {STAGE_LABELS[lead.pipeline_stage]}
              </Badge>
              <Badge
                variant="outline"
                className={cn("normal-case tracking-normal", priorityBadgeClass(lead.priority))}
              >
                Prioridade {PRIORITY_LABELS[lead.priority].toLowerCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>Detalhes do lead e histórico de contatos.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
            {intel.operationalTier !== "terminal" &&
            intel.operationalTier !== "deprioritize" ? (
              <section
                aria-label="Recomendação do sistema"
                className={cn(
                  "rounded-lg border p-4",
                  intel.attentionLevel === "critical"
                    ? "border-rose-500/50 bg-rose-500/10"
                    : intel.attentionLevel === "today"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-sky-500/30 bg-sky-500/10",
                )}
              >
                <header className="flex flex-wrap items-center gap-2">
                  <Sparkles className="size-4 text-lf-volt" aria-hidden />
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    Recomendação do sistema
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "normal-case tracking-normal",
                      attentionBadgeClass(intel.attentionLevel),
                    )}
                  >
                    {intel.tierLabel}
                  </Badge>
                  {intel.dueLabel ? (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                      <Clock className="size-3" aria-hidden /> {intel.dueLabel}
                    </span>
                  ) : null}
                </header>
                <p className="mt-2 text-base font-medium text-foreground">
                  {intel.suggestedActionLabel}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-lf-muted">
                  Prioridade operacional {intel.score}/100
                </p>

                {intel.reasons.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {intel.reasons.map((reason) => (
                      <li
                        key={reason}
                        className="flex gap-2 text-sm text-foreground/90"
                      >
                        <AlertTriangle
                          className="mt-0.5 size-3.5 shrink-0 text-amber-300"
                          aria-hidden
                        />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setMode(mapSuggestedActionToMode(intel.suggestedAction))
                    }
                    className="gap-2"
                  >
                    {primaryActionButtonLabel(intel.suggestedAction)}
                  </Button>
                  {wa ? (
                    <a
                      href={`https://wa.me/${wa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 lf-focus"
                    >
                      <MessageSquare className="size-3.5" aria-hidden /> Abrir WhatsApp
                    </a>
                  ) : null}
                </div>
              </section>
            ) : (
              <section
                aria-label="Lead encerrado"
                className="rounded-lg border border-neutral-500/40 bg-neutral-500/10 p-3 text-sm text-lf-muted"
              >
                {intel.reasons[0] ?? "Lead encerrado — apenas no histórico."}
              </section>
            )}

            <section className="grid gap-3 rounded-lg border border-border/80 bg-lf-graphite/50 p-3 sm:grid-cols-2">
              <Field label="Celular" value={formatPhoneForDisplay(lead.phone) || "—"} />
              <Field label="Email" value={lead.email ?? "—"} />
              <Field label="Origem" value={lead.source ? SOURCE_LABELS[lead.source] : "—"} />
              <Field label="Data de recebimento" value={formatDateTime(lead.received_at)} />
              <Field label="Último contato" value={formatDateTime(lead.last_contact_at)} />
              <Field label="Status da última conversa" value={lead.last_conversation_status ?? "—"} />
              <Field label="Próxima ação" value={lead.next_action ?? "—"} />
              <Field label="Próximo contato" value={formatDateTime(lead.next_contact_at)} />
              <Field label="Investimento disponível" value={lead.investment_range ?? "—"} />
              <Field label="Prazo para iniciar" value={lead.start_timeline ?? "—"} />
              <Field label="Identificação no WhatsApp" value={lead.whatsapp_label ?? "—"} />
              {lead.pipeline_stage === "lost" ? (
                <Field label="Motivo da perda" value={lead.lost_reason ?? "—"} />
              ) : null}
            </section>

            {lead.notes ? (
              <section className="rounded-lg border border-border/80 bg-card/50 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-lf-muted">Observações</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{lead.notes}</p>
              </section>
            ) : null}

            <section className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setMode(mode === "contact" ? "none" : "contact")} className="gap-2">
                <PhoneCall className="size-4" aria-hidden /> Registrar contato
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setMode(mode === "stage" ? "none" : "stage")} className="gap-2">
                <GitBranch className="size-4" aria-hidden /> Alterar etapa
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setMode(mode === "schedule" ? "none" : "schedule")} className="gap-2">
                <CalendarPlus className="size-4" aria-hidden /> Agendar próximo contato
              </Button>
              {canEditCadastro ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)} className="gap-2">
                  <Pencil className="size-4" aria-hidden /> Editar lead
                </Button>
              ) : null}
            </section>

            {mode === "contact" ? (
              <RegisterContactForm
                lead={lead}
                onDone={() => setMode("none")}
              />
            ) : null}
            {mode === "stage" ? (
              <ChangeStageForm lead={lead} onDone={() => setMode("none")} />
            ) : null}
            {mode === "schedule" ? (
              <ScheduleNextContactForm lead={lead} onDone={() => setMode("none")} />
            ) : null}

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-lf-muted">
                Histórico de contatos
              </h3>
              {sortedActivities.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/80 px-3 py-6 text-center text-sm text-lf-muted">
                  Nenhum contato registrado ainda.
                </p>
              ) : (
                <ol className="space-y-2">
                  {sortedActivities.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-md border border-border/60 bg-card/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-lf-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {formatDateTime(a.occurred_at)}
                        </span>
                        <span className="rounded border border-border/60 px-1.5 py-0.5 uppercase tracking-wide">
                          {activityLabels[a.activity_type]}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{a.summary}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border/80 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canEditCadastro && editing ? (
        <LeadDialog
          mode="edit"
          open={editing}
          onOpenChange={(o) => {
            setEditing(o);
            if (!o) onOpenChange(false);
          }}
          role={role}
          lead={lead}
        />
      ) : null}
    </>
  );
}

function mapSuggestedActionToMode(
  action: LeadIntelligence["suggestedAction"],
): ActionMode {
  switch (action) {
    case "record_meeting_outcome":
    case "call_now":
    case "whatsapp_reconnect":
    case "send_followup":
    case "resend_other_time":
    case "confirm_visit":
    case "validate_phone":
      return "contact";
    case "confirm_meeting":
    case "schedule_meeting":
      return "schedule";
    case "wait_until_scheduled":
    case "history_only":
    default:
      return "contact";
  }
}

function primaryActionButtonLabel(
  action: LeadIntelligence["suggestedAction"],
): string {
  switch (action) {
    case "record_meeting_outcome":
      return "Registrar resultado";
    case "schedule_meeting":
    case "confirm_meeting":
      return "Agendar / confirmar";
    case "call_now":
    case "whatsapp_reconnect":
    case "send_followup":
    case "resend_other_time":
    case "confirm_visit":
      return "Registrar contato";
    case "validate_phone":
      return "Registrar contato";
    default:
      return "Registrar contato";
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lf-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground/90">{value}</p>
    </div>
  );
}

function RegisterContactForm({ lead, onDone }: { lead: FranchiseLead; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<FranchiseLeadStage>(lead.pipeline_stage);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("lead_id", lead.id);
    startTransition(async () => {
      const r = await registerContact(formData);
      if (r.ok) onDone();
      else setError(r.message);
    });
  }

  return (
    <form action={onSubmit} className="rounded-lg border border-border/80 bg-lf-graphite/60 p-4">
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rc-occurred">Data e horário</Label>
            <Input
              id="rc-occurred"
              name="occurred_at"
              type="datetime-local"
              defaultValue={utcIsoToBrtInput(new Date().toISOString())}
              disabled={pending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rc-stage">Etapa atual</Label>
            <select
              id="rc-stage"
              name="pipeline_stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as FranchiseLeadStage)}
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
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="rc-summary">Resumo da conversa</Label>
          <textarea
            id="rc-summary"
            name="summary"
            required
            rows={3}
            disabled={pending}
            placeholder="O que foi conversado, o que ficou combinado."
            className="min-h-24 w-full rounded-md border border-input bg-lf-graphite px-3 py-2 text-sm text-foreground placeholder:text-lf-muted lf-focus disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rc-next-action">Próxima ação</Label>
            <Input
              id="rc-next-action"
              name="next_action"
              defaultValue={lead.next_action ?? ""}
              placeholder="Ex.: Reenviar mensagem"
              disabled={pending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rc-next-contact">Data do próximo contato</Label>
            <Input
              id="rc-next-contact"
              name="next_contact_at"
              type="datetime-local"
              defaultValue={utcIsoToBrtInput(lead.next_contact_at)}
              disabled={pending}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Registrar contato"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ChangeStageForm({ lead, onDone }: { lead: FranchiseLead; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<FranchiseLeadStage>(lead.pipeline_stage);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("lead_id", lead.id);
    startTransition(async () => {
      const r = await changeStage(formData);
      if (r.ok) onDone();
      else setError(r.message);
    });
  }

  return (
    <form action={onSubmit} className="rounded-lg border border-border/80 bg-lf-graphite/60 p-4">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cs-stage">Nova etapa</Label>
          <select
            id="cs-stage"
            name="pipeline_stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as FranchiseLeadStage)}
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
        {stage === "lost" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="cs-lost">Motivo da perda</Label>
            <Input
              id="cs-lost"
              name="lost_reason"
              required
              defaultValue={lead.lost_reason ?? ""}
              placeholder="Ex.: Fechou com concorrente"
              disabled={pending}
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Alterar etapa"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ScheduleNextContactForm({ lead, onDone }: { lead: FranchiseLead; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("lead_id", lead.id);
    const raw = String(formData.get("next_contact_at") ?? "");
    if (!raw || !brtInputToUtcIso(raw)) {
      setError("Informe uma data válida.");
      return;
    }
    startTransition(async () => {
      const r = await scheduleNextContact(formData);
      if (r.ok) onDone();
      else setError(r.message);
    });
  }

  return (
    <form action={onSubmit} className="rounded-lg border border-border/80 bg-lf-graphite/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="sn-next">Data e horário</Label>
          <Input
            id="sn-next"
            name="next_contact_at"
            type="datetime-local"
            required
            defaultValue={utcIsoToBrtInput(lead.next_contact_at)}
            disabled={pending}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sn-action">Próxima ação (opcional)</Label>
          <Input
            id="sn-action"
            name="next_action"
            defaultValue={lead.next_action ?? ""}
            placeholder="Ex.: Confirmar reunião"
            disabled={pending}
          />
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Agendar"}
        </Button>
      </div>
    </form>
  );
}
