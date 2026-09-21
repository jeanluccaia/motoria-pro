"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Car,
  User,
  Wallet,
  KeyRound,
  Repeat,
  History,
} from "lucide-react";
import type { DgnCustomer } from "@/lib/growth/dgn-growth-utils";
import {
  CommercialEditor,
  ContactPhoneEditor,
  VehiclesPhotoAndFieldsEditor,
  AppointmentsEditor,
  PortalAccessEditor,
} from "@/components/growth/DgnGrowthWorkspace";
import { SubscriptionsManager } from "@/components/growth/SubscriptionsManager";
import {
  derivePortalAccessStatus,
  type PortalAccessStatusResult,
} from "@/lib/growth/portal/access-status";

type PaymentMethod = NonNullable<DgnCustomer["subscription"]>["paymentMethod"];

function paymentMethodDisplay(method: PaymentMethod, label: string | null): string {
  if (label && label.trim()) return label.trim();
  switch (method) {
    case "card_recurring": return "Recorrência no cartão";
    case "manual":         return "Cobrança manual";
    case "not_needed":     return "—";
    case "unknown":        return "Não identificada";
    default:               return "Não identificada";
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function planFrequencyLabel(plan: string | null | undefined): string {
  switch ((plan ?? "").trim()) {
    case "Essential":       return "1 lavagem/mês";
    case "Smart":           return "2 lavagens/mês";
    case "Priority":        return "4 lavagens/mês";
    case "Corporate Care":  return "Frota — conforme contrato";
    default:                return "A definir pelo plano";
  }
}

function subscriptionStatusLabel(status: string | null | undefined): { label: string; tone: string } {
  const raw = (status ?? "").toLowerCase();
  if (raw === "ativo")               return { label: "Ativo",              tone: "text-emerald-300 border-emerald-300/30 bg-emerald-300/[0.06]" };
  if (raw === "detectado")           return { label: "Detectado",          tone: "text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/10" };
  if (raw === "pendente_validacao") return { label: "Pendente validação", tone: "text-white/70 border-white/15 bg-white/[0.04]" };
  if (raw === "inadimplente")        return { label: "Inadimplente",       tone: "text-red-300 border-red-300/30 bg-red-300/[0.06]" };
  if (raw === "cancelado")           return { label: "Cancelado",          tone: "text-white/50 border-white/10 bg-white/[0.02]" };
  if (raw === "encerrado")           return { label: "Encerrado",          tone: "text-white/50 border-white/10 bg-white/[0.02]" };
  return { label: "Sem assinatura", tone: "text-white/50 border-white/10 bg-white/[0.02]" };
}

function Section({
  index,
  title,
  icon: Icon,
  children,
  hint,
}: {
  index: number;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5 sm:p-6">
      <header className="flex items-start gap-3 border-b border-white/[0.05] pb-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#E7C96A]">
          <Icon size={16} />
        </span>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">
            <span className="text-white/40">{String(index).padStart(2, "0")} · </span>
            {title}
          </h2>
          {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
        </div>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function portalChipTone(status: PortalAccessStatusResult["status"]): string {
  switch (status) {
    case "ACCESS_PROVISIONED":
      return "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-200";
    case "ACCESS_INCOMPLETE":
      return "border-amber-300/30 bg-amber-300/[0.06] text-amber-200";
    case "INCONSISTENT":
      return "border-red-300/30 bg-red-300/[0.06] text-red-200";
    case "NOT_PROVISIONED":
    default:
      return "border-white/[0.08] bg-white/[0.03] text-white/70";
  }
}

function HeaderChip({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`inline-flex flex-col rounded-lg border px-3 py-1.5 ${tone ?? "border-white/[0.08] bg-white/[0.03] text-white/80"}`}>
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] opacity-60">{label}</span>
      <span className="mt-0.5 text-[13px] font-medium">{value}</span>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

export function CustomerFullscreen({
  customer: initial,
  dataOrigin,
  backHref,
}: {
  customer: DgnCustomer;
  dataOrigin: "json" | "db" | "json-fallback";
  backHref: string;
}) {
  const [customer, setCustomer] = useState<DgnCustomer>(initial);
  const editable = dataOrigin === "db";

  const status = subscriptionStatusLabel(customer.subscription?.status);
  const planLabel = (customer.activePlan?.trim() || "Sem plano ativo");
  const vehicleLabel = customer.vehicle || "A definir";
  // Estado canônico do Portal — MESMO critério do agent (portal-readiness) e
  // do PortalAccessEditor. knownSubscriberPlan/commercialStatus NÃO entram.
  const portalStatus: PortalAccessStatusResult = derivePortalAccessStatus({
    canonicalSubscriptionActive: customer.subscription?.isActive === true,
    hasEmail: customer.portalAccess?.hasEmail === true,
    hasAuthLink: customer.portalAccess?.hasAuthLink === true,
    portalBetaEnabled: customer.portalAccess?.portalBetaEnabled === true,
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 transition hover:text-[#E7C96A]"
          >
            <ArrowLeft size={12} />
            Assinantes
          </Link>
        </div>

        <header className="rounded-2xl border border-white/[0.06] bg-[#101010] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
                Ficha do assinante
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                {customer.name || "Sem nome"}
              </h1>
              <p className="mt-2 text-xs text-white/45">
                ID operacional: <span className="font-mono text-white/60">{customer.id}</span>
              </p>
            </div>
            {!editable && (
              <span className="inline-flex h-fit items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                Persistência não habilitada — leitura apenas
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <HeaderChip label="Status" value={status.label} tone={status.tone} />
            <HeaderChip label="Plano vigente" value={planLabel} />
            <HeaderChip label="Veículo principal" value={vehicleLabel} />
            <HeaderChip
              label="Portal"
              value={portalStatus.label}
              tone={portalChipTone(portalStatus.status)}
            />
          </div>
        </header>

        <main className="mt-6 space-y-5">
          <Section
            index={1}
            title="Dados do cliente"
            icon={User}
            hint="Contato canônico + gestão comercial. Alterações registradas em audit log."
          >
            <div className="space-y-6">
              <ContactPhoneEditor
                key={`contact-${customer.id}`}
                customerId={customer.id}
                currentPhone={customer.phone}
                enabled={editable}
              />
              <div className="border-t border-white/[0.04] pt-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Gestão comercial
                </p>
                <CommercialEditor
                  key={`commercial-${customer.id}`}
                  customer={customer}
                  enabled={editable}
                  onSaved={(id, commercial) =>
                    setCustomer((prev) => (prev.id === id ? { ...prev, commercial } : prev))
                  }
                />
              </div>
            </div>
          </Section>

          <Section
            index={2}
            title="Gerenciar assinaturas"
            icon={Wallet}
            hint="Cria, edita e cancela contratos manuais (Essential/Smart/Priority × Mensal/Fidelidade 6m/12m). Contratos PagBank ficam read-only — pagamento e vigência vêm pelo importer."
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Fact label="Cliente desde" value={customer.customerSince || "—"} />
                <Fact label="Último atendimento" value={customer.lastAttendance || "—"} />
                <Fact
                  label="Forma de pagamento (contrato vigente)"
                  value={paymentMethodDisplay(
                    customer.subscription?.paymentMethod ?? null,
                    customer.subscription?.paymentMethodLabel ?? null,
                  )}
                />
                <Fact label="Próxima cobrança (contrato vigente)" value={formatDate(customer.subscription?.nextDueDate)} />
              </div>
              <SubscriptionsManager
                key={`subs-${customer.id}`}
                customerId={customer.id}
                enabled={editable}
              />
            </div>
          </Section>

          <Section
            index={3}
            title="Veículos"
            icon={Car}
            hint="Marca, modelo, placa e foto principal. Foto vive em bucket privado (signed URL 7 dias)."
          >
            <VehiclesPhotoAndFieldsEditor
              key={`vehicles-${customer.id}`}
              customerId={customer.id}
              enabled={editable}
            />
          </Section>

          <Section
            index={4}
            title="Rotina de atendimento"
            icon={Repeat}
            hint="Frequência esperada derivada do plano. Override manual é evolução futura."
          >
            <div className="flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Padrão do plano vigente
                </p>
                <p className="mt-1 text-sm font-medium text-white/85">
                  {planFrequencyLabel(customer.activePlan)}
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50">
                Derivado do plano
              </span>
            </div>
          </Section>

          <Section
            index={5}
            title="Próximos atendimentos"
            icon={Calendar}
            hint="Criar, editar (reagendar in-place) e cancelar. Toda edição é auditada e reflete imediatamente no Portal do assinante."
          >
            <AppointmentsEditor
              key={`appointments-${customer.id}`}
              customerId={customer.id}
              enabled={editable}
            />
          </Section>

          <Section
            index={6}
            title="Histórico operacional"
            icon={History}
            hint="Últimos eventos registrados (atendimentos, interações). Fonte: crm_interactions."
          >
            {customer.attendanceHistory.length === 0 ? (
              <p className="text-sm text-white/45">Nenhum evento registrado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {customer.attendanceHistory.slice(0, 8).map((entry, idx) => (
                  <li
                    key={`${idx}-${entry}`}
                    className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-sm text-white/75"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            index={7}
            title="Acesso ao Portal"
            icon={KeyRound}
            hint="Liberar acesso, reenviar magic link ou desabilitar. Convite WhatsApp chega na Fatia 2c."
          >
            <PortalAccessEditor
              key={`portal-${customer.id}`}
              customerId={customer.id}
              enabled={editable}
            />
          </Section>
        </main>

        <footer className="mt-8 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#101010] p-4 text-[11px] text-white/40">
          <ShieldCheck size={14} className="shrink-0" />
          Toda edição realizada aqui passa pelos endpoints canônicos do Batch 2 e é registrada em
          audit log. Founders Nº001, Nº002, Nº003 permanecem preservados; Iara Nº004 aberta.
        </footer>
      </div>
    </div>
  );
}
