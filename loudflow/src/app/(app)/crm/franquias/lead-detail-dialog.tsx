"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Pencil,
  PhoneCall,
  GitBranch,
  CalendarPlus,
  Clock,
  MessageSquare,
  Zap,
  CalendarClock,
  PhoneOff,
  MessageCircleDashed,
  Pause,
  Archive,
  CheckCircle,
  AlertTriangle,
  Mail,
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
} from "@/lib/crm/labels";
import { formatDateTime, utcIsoToBrtInput, brtInputToUtcIso } from "@/lib/crm/dates";
import { formatPhoneForDisplay } from "@/lib/crm/phone";
import {
  calculateLeadIntelligence,
  type LeadIntelligence,
} from "@/lib/crm/intelligence";
import {
  getLeadPresentation,
  type IconKey,
  type LeadPresentation,
  type Tone,
} from "@/lib/crm/presentation";
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

  const intel = useMemo<LeadIntelligence>(() => {
    if (intelligence) return intelligence;
    return calculateLeadIntelligence(lead, activities, new Date());
  }, [intelligence, lead, activities]);

  const presentation = useMemo(() => getLeadPresentation(lead, intel), [lead, intel]);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    [activities],
  );

  const phoneInvalid = presentation.phone.state !== "valid";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            // Mobile: tela cheia; desktop: modal padrão.
            "flex max-h-[100svh] w-full flex-col overflow-hidden p-0 sm:max-w-2xl",
            "h-[100svh] sm:h-auto sm:max-h-[calc(100svh-2rem)]",
          )}
        >
          <DialogHeader className="shrink-0 border-b border-border/70 px-4 pt-4 pb-3 sm:px-6 sm:pt-5">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <span className="truncate">{lead.full_name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "normal-case tracking-normal",
                  stageBadgeClass(lead.pipeline_stage),
                )}
              >
                {STAGE_LABELS[lead.pipeline_stage]}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detalhes do lead, próxima ação e histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            {phoneInvalid ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {presentation.phone.state === "incomplete"
                    ? "Telefone incompleto — confirme o número antes de qualquer contato por WhatsApp ou ligação."
                    : "Lead sem telefone cadastrado — use o email ou obtenha um número antes de ligar."}
                </span>
              </div>
            ) : null}

            {/* 1. Situação atual */}
            <section aria-label="Situação atual" className="space-y-2">
              <SectionTitle>Situação atual</SectionTitle>
              <StatusChipRow presentation={presentation} />
              <p className="text-sm text-foreground/90">{presentation.reason}</p>
              {intel.reasons.length > 1 ? (
                <ul className="space-y-1 text-xs text-lf-muted">
                  {intel.reasons.slice(1).map((r) => (
                    <li key={r} className="flex gap-1.5">
                      <span aria-hidden>·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            {/* 2. Próxima ação */}
            {presentation.group !== "history" ? (
              <section aria-label="Próxima ação" className="space-y-2">
                <SectionTitle>Próxima ação</SectionTitle>
                <PrimaryActionBar
                  presentation={presentation}
                  onPrimary={() => {
                    if (presentation.action.intent === "open_edit") {
                      setEditing(true);
                      return;
                    }
                    setMode(mapSuggestedActionToMode(intel.suggestedAction));
                  }}
                />
                {presentation.action.primary ? (
                  <ActionShortcuts mode={mode} setMode={setMode} />
                ) : null}
                {mode === "contact" ? (
                  <RegisterContactForm lead={lead} onDone={() => setMode("none")} />
                ) : null}
                {mode === "stage" ? (
                  <ChangeStageForm lead={lead} onDone={() => setMode("none")} />
                ) : null}
                {mode === "schedule" ? (
                  <ScheduleNextContactForm lead={lead} onDone={() => setMode("none")} />
                ) : null}
              </section>
            ) : (
              <section
                aria-label="Lead encerrado"
                className="rounded-lg border border-neutral-500/40 bg-neutral-500/10 p-3 text-sm text-lf-muted"
              >
                {presentation.historyBadge === "deprioritize"
                  ? "Lead marcado como Não priorizar — não é candidato à franquia."
                  : "Lead encerrado — apenas no histórico."}
                <ActionShortcuts mode={mode} setMode={setMode} compact />
                {mode === "contact" ? (
                  <RegisterContactForm lead={lead} onDone={() => setMode("none")} />
                ) : null}
                {mode === "stage" ? (
                  <ChangeStageForm lead={lead} onDone={() => setMode("none")} />
                ) : null}
                {mode === "schedule" ? (
                  <ScheduleNextContactForm lead={lead} onDone={() => setMode("none")} />
                ) : null}
              </section>
            )}

            {/* 3. Contato */}
            <section aria-label="Contato" className="space-y-2">
              <SectionTitle>Contato</SectionTitle>
              <div className="grid gap-3 rounded-lg border border-border/80 bg-lf-graphite/50 p-3 sm:grid-cols-2">
                <Field label="Celular" value={formatPhoneForDisplay(lead.phone) || "—"} />
                <Field label="Email" value={lead.email ?? "—"} />
                <Field
                  label="Identificação no WhatsApp"
                  value={lead.whatsapp_label ?? "—"}
                />
                <Field
                  label="Origem"
                  value={lead.source ? SOURCE_LABELS[lead.source] : "—"}
                />
              </div>
            </section>

            {/* 4. Histórico */}
            <section aria-label="Histórico de contatos" className="space-y-2">
              <SectionTitle>Histórico</SectionTitle>
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
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                        {a.summary}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* 5. Informações complementares — recolhidas por padrão */}
            <details className="rounded-lg border border-border/80 bg-card/50 open:bg-card/70">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-lf-muted lf-focus">
                <span>Informações complementares</span>
                <span className="text-[11px] font-normal normal-case text-lf-muted/80">
                  Clique para expandir
                </span>
              </summary>
              <div className="grid gap-3 border-t border-border/60 p-3 sm:grid-cols-2">
                <Field label="Data de recebimento" value={formatDateTime(lead.received_at)} />
                <Field label="Último contato" value={formatDateTime(lead.last_contact_at)} />
                <Field
                  label="Status da última conversa"
                  value={lead.last_conversation_status ?? "—"}
                />
                <Field label="Próxima ação cadastrada" value={lead.next_action ?? "—"} />
                <Field label="Próximo contato" value={formatDateTime(lead.next_contact_at)} />
                <Field
                  label="Investimento disponível"
                  value={lead.investment_range ?? "—"}
                />
                <Field label="Prazo para iniciar" value={lead.start_timeline ?? "—"} />
                <Field
                  label="Marcação manual"
                  value={PRIORITY_LABELS[lead.priority]}
                />
                {lead.pipeline_stage === "lost" ? (
                  <Field label="Motivo da perda" value={lead.lost_reason ?? "—"} />
                ) : null}
                {lead.notes ? (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-lf-muted">
                      Observações
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">
                      {lead.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </details>
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t border-border/80 px-4 py-3 sm:px-6">
            <div>
              {canEditCadastro ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="size-4" aria-hidden /> Editar cadastro
                </Button>
              ) : null}
            </div>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
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

// ------------------------------------------------------------------
// Pedaços visuais
// ------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lf-muted">
      {children}
    </h3>
  );
}

function iconFor(key: IconKey, className: string): React.ReactNode {
  const common = { className, "aria-hidden": true } as const;
  switch (key) {
    case "zap":
      return <Zap {...common} />;
    case "phone-call":
      return <PhoneCall {...common} />;
    case "calendar-clock":
      return <CalendarClock {...common} />;
    case "phone-off":
      return <PhoneOff {...common} />;
    case "message-circle-dashed":
      return <MessageCircleDashed {...common} />;
    case "pause":
      return <Pause {...common} />;
    case "archive":
      return <Archive {...common} />;
    case "check-circle":
      return <CheckCircle {...common} />;
  }
}

function toneChip(tone: Tone): string {
  switch (tone) {
    case "critical":
      return "border-rose-500/50 bg-rose-500/15 text-rose-200";
    case "warn":
      return "border-amber-500/50 bg-amber-500/15 text-amber-200";
    case "info":
      return "border-sky-500/40 bg-sky-500/10 text-sky-200";
    case "ok":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "muted":
    default:
      return "border-border/60 bg-lf-graphite/60 text-lf-muted";
  }
}

function StatusChipRow({ presentation }: { presentation: LeadPresentation }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-semibold normal-case tracking-wide",
          toneChip(presentation.statusTone),
        )}
        role="status"
      >
        {iconFor(presentation.statusIcon, "size-3.5")}
        <span>{presentation.statusLabel}</span>
      </span>
      {presentation.dueLabel && presentation.dueLabel !== presentation.statusLabel ? (
        <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-wide text-amber-200">
          <Clock className="size-3" aria-hidden />
          {presentation.dueLabel}
        </span>
      ) : null}
    </div>
  );
}

function PrimaryActionBar({
  presentation,
  onPrimary,
}: {
  presentation: LeadPresentation;
  onPrimary: () => void;
}) {
  // Awaiting — sem ação ativa antecipada.
  if (!presentation.action.primary) {
    return (
      <div className="rounded-lg border border-border/60 bg-lf-graphite/60 px-3 py-2 text-sm text-lf-muted">
        <span className="inline-flex items-center gap-2">
          <Pause className="size-4" aria-hidden />
          {presentation.statusLabel}
        </span>
      </div>
    );
  }

  const { action } = presentation;
  const buttonIcon =
    action.intent === "mailto" ? (
      <Mail className="size-4" aria-hidden />
    ) : action.intent === "open_edit" ? (
      <Pencil className="size-4" aria-hidden />
    ) : (
      iconFor(presentation.statusIcon, "size-4")
    );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        {action.label}
      </p>
      <div className="flex flex-wrap items-stretch gap-2 sm:items-center">
        {action.intent === "mailto" && action.href ? (
          <a
            href={action.href}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-lf-volt px-4 text-sm font-semibold text-black hover:bg-lf-volt/90 lf-focus sm:min-h-12 sm:w-auto"
          >
            {buttonIcon}
            <span>{action.buttonLabel}</span>
          </a>
        ) : (
          <Button
            type="button"
            onClick={onPrimary}
            className="min-h-14 w-full gap-2 whitespace-nowrap px-4 text-sm sm:min-h-12 sm:w-auto"
          >
            {buttonIcon}
            <span>{action.buttonLabel}</span>
          </Button>
        )}
        {action.intent === "default" &&
        presentation.phone.canUseWhatsAppSecondary &&
        presentation.phone.waHref ? (
          <a
            href={presentation.phone.waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-500/50 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 lf-focus"
            aria-label="Abrir conversa no WhatsApp"
          >
            <MessageSquare className="size-4" aria-hidden /> WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

function ActionShortcuts({
  mode,
  setMode,
  compact,
}: {
  mode: ActionMode;
  setMode: (m: ActionMode) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "mt-2" : null)}>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setMode(mode === "contact" ? "none" : "contact")}
        className="gap-2"
      >
        <PhoneCall className="size-4" aria-hidden /> Registrar contato
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setMode(mode === "stage" ? "none" : "stage")}
        className="gap-2"
      >
        <GitBranch className="size-4" aria-hidden /> Alterar etapa
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setMode(mode === "schedule" ? "none" : "schedule")}
        className="gap-2"
      >
        <CalendarPlus className="size-4" aria-hidden /> Agendar próximo contato
      </Button>
    </div>
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
    case "answer_new_lead":
    case "forward_to_expansion":
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lf-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground/90">{value}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// Forms de ação (preservados com pequenos ajustes)
// ------------------------------------------------------------------

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
