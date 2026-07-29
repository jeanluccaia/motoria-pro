"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  Link2,
  MessageCircle,
  PanelRight,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  buildFounderWhatsappMessage,
  buildFounderWhatsappUrl,
  founders2026Campaign,
  founders2026Guests,
  founders2026Statuses,
  type FounderCampaignGuest,
  type FounderCampaignStatus,
} from "@/lib/campaigns/founders-2026-data";

const statusStyles: Record<FounderCampaignStatus, { bg: string; color: string; border: string }> = {
  Pendente: {
    bg: "rgba(156,163,175,0.08)",
    color: "#D1D5DB",
    border: "rgba(156,163,175,0.16)",
  },
  "Convite enviado": {
    bg: "rgba(96,165,250,0.1)",
    color: "#93C5FD",
    border: "rgba(96,165,250,0.18)",
  },
  Visualizou: {
    bg: "rgba(167,139,250,0.1)",
    color: "#C4B5FD",
    border: "rgba(167,139,250,0.18)",
  },
  Respondeu: {
    bg: "rgba(45,212,191,0.1)",
    color: "#5EEAD4",
    border: "rgba(45,212,191,0.18)",
  },
  "Link aberto": {
    bg: "rgba(251,191,36,0.1)",
    color: "#FCD34D",
    border: "rgba(251,191,36,0.2)",
  },
  "Pagamento pendente": {
    bg: "rgba(249,115,22,0.1)",
    color: "#FDBA74",
    border: "rgba(249,115,22,0.2)",
  },
  Convertido: {
    bg: "rgba(52,211,153,0.12)",
    color: "#6EE7B7",
    border: "rgba(52,211,153,0.22)",
  },
  Perdido: {
    bg: "rgba(248,113,113,0.1)",
    color: "#FCA5A5",
    border: "rgba(248,113,113,0.22)",
  },
};

const actionStatuses: FounderCampaignStatus[] = [
  "Convite enviado",
  "Visualizou",
  "Respondeu",
  "Pagamento pendente",
  "Convertido",
  "Perdido",
];

const actionIcons: Record<FounderCampaignStatus, LucideIcon> = {
  Pendente: Sparkles,
  "Convite enviado": Send,
  Visualizou: Eye,
  Respondeu: MessageCircle,
  "Link aberto": Link2,
  "Pagamento pendente": Banknote,
  Convertido: BadgeCheck,
  Perdido: XCircle,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getCurrentOrigin() {
  if (typeof window === "undefined") {
    return "https://app.dgnclub.com";
  }

  return window.location.origin;
}

function joinUrl(origin: string, path: string) {
  return `${origin}${path}`;
}

export function Founders2026CampaignCenter() {
  const [statuses, setStatuses] = useState<Record<string, FounderCampaignStatus>>(
    Object.fromEntries(
      founders2026Guests.map((guest) => [guest.id, guest.campaignParticipation.status])
    )
  );
  const [selectedGuestId, setSelectedGuestId] = useState(founders2026Guests[0]?.id ?? "");
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const selectedGuest =
    founders2026Guests.find((guest) => guest.id === selectedGuestId) ?? founders2026Guests[0];

  const stats = useMemo(() => {
    const withStatus = founders2026Guests.map((guest) => ({
      guest,
      status: statuses[guest.id] ?? guest.campaignParticipation.status,
    }));
    const activeGuests = withStatus.filter(({ guest }) => !guest.isPlaceholder);
    const converted = activeGuests.filter(({ status }) => status === "Convertido");
    const pendingPayment = activeGuests.filter(({ status }) => status === "Pagamento pendente");
    const sent = activeGuests.filter(({ status }) => status !== "Pendente");
    const viewed = activeGuests.filter(
      ({ status }) => status === "Visualizou" || status === "Link aberto"
    );
    const responded = activeGuests.filter(({ status }) => status === "Respondeu");

    return {
      totalGuests: founders2026Campaign.capacity,
      sent: sent.length,
      viewed: viewed.length,
      responded: responded.length,
      pendingPayment: pendingPayment.length,
      converted: converted.length,
      potentialRevenue: activeGuests.reduce(
        (sum, { guest }) => sum + guest.campaignParticipation.potentialRevenue,
        0
      ),
      confirmedRevenue: activeGuests.reduce((sum, { guest, status }) => {
        if (status === "Convertido") {
          return sum + guest.campaignParticipation.potentialRevenue;
        }

        return sum + guest.campaignParticipation.confirmedRevenue;
      }, 0),
    };
  }, [statuses]);

  const setStatus = (guestId: string, status: FounderCampaignStatus) => {
    setStatuses((current) => ({ ...current, [guestId]: status }));
  };

  const copyText = async (label: string, value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(null), 1800);
  };

  const getGuestMessage = (guest: FounderCampaignGuest) =>
    buildFounderWhatsappMessage(guest, getCurrentOrigin());

  const copyPersonalizedLink = (guest: FounderCampaignGuest) => {
    const path = guest.campaignParticipation.personalizedPagePath;
    if (!path) return;
    void copyText(`link-${guest.id}`, joinUrl(getCurrentOrigin(), path));
  };

  const copyMessage = (guest: FounderCampaignGuest) => {
    void copyText(`message-${guest.id}`, getGuestMessage(guest));
  };

  const openWhatsapp = (guest: FounderCampaignGuest) => {
    window.open(
      buildFounderWhatsappUrl(guest, getGuestMessage(guest)),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/[0.08] bg-[#0B0B0B]/95 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
              DGN Growth
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              Campaign Center Founders 2026
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
              Área interna para acompanhar os 30 convidados Founders, começando pelo Founder Nº001.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/growth"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm font-semibold text-[#E5E7EB] transition hover:border-[#C9A84C]/35 hover:text-white"
            >
              DGN Growth
            </Link>
            <Link
              href="/founders/jose-moreira"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-3 text-sm font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/45"
            >
              <ExternalLink size={15} />
              Página do José
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-5 rounded-lg border border-[#C9A84C]/18 bg-[#111111] p-4">
          <div className="flex gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#C9A84C]" />
            <div>
              <p className="text-sm font-semibold text-white">Uso interno</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
                Esta rota deve ser protegida por autenticação/admin antes de uso real em produção.
                Nesta etapa, não há integração com WhatsApp Business API, 4U ou banco definitivo.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total de convidados" value={String(stats.totalGuests)} />
          <MetricCard label="Convites enviados" value={String(stats.sent)} />
          <MetricCard label="Visualizações" value={String(stats.viewed)} />
          <MetricCard label="Respostas" value={String(stats.responded)} />
          <MetricCard label="Pagamentos pendentes" value={String(stats.pendingPayment)} />
          <MetricCard label="Convertidos" value={String(stats.converted)} />
          <MetricCard label="Receita potencial" value={formatCurrency(stats.potentialRevenue)} wide />
          <MetricCard label="Receita confirmada" value={formatCurrency(stats.confirmedRevenue)} wide />
          <MetricCard
            label="Progresso"
            value={`${stats.converted} / ${founders2026Campaign.capacity}`}
            detail="Founders convertidos"
            wide
          />
        </section>

        <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#101010]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
                Mesa da campanha
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {stats.converted} / {founders2026Campaign.capacity} Founders convertidos
              </h2>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06] sm:w-72">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#C9A84C,#F0D060)]"
                style={{
                  width: `${(stats.converted / founders2026Campaign.capacity) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] text-left">
                  {[
                    "Founder",
                    "Cliente",
                    "Veículo",
                    "Plano recomendado",
                    "Status",
                    "Próxima ação",
                    "Valor potencial",
                    "Links",
                    "Ações",
                  ].map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {founders2026Guests.map((guest) => {
                  const status = statuses[guest.id] ?? guest.campaignParticipation.status;
                  const personalizedPath = guest.campaignParticipation.personalizedPagePath;

                  return (
                    <tr
                      key={guest.id}
                      className="border-b border-white/[0.05] transition hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-[#C9A84C]/16 bg-[#C9A84C]/8 px-2.5 py-1 text-xs font-semibold text-[#E7C96A]">
                          <Crown size={14} />
                          {guest.founderNumber}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedGuestId(guest.id)}
                          className="group text-left"
                        >
                          <span className="block text-sm font-semibold text-white group-hover:text-[#E7C96A]">
                            {guest.name}
                          </span>
                          <span className="mt-1 block text-xs text-[#747474]">
                            {guest.isPlaceholder ? "Slot interno" : "Perfil comercial"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-[#E5E7EB]">{guest.vehicle}</p>
                        <p className="mt-1 text-xs text-[#747474]">{guest.maskedPlate}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#D1D5DB]">
                        {guest.recommendedPlan}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="max-w-[190px] px-4 py-4 text-sm leading-relaxed text-[#A7A7A7]">
                        {guest.campaignParticipation.nextAction}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-white">
                        {formatCurrency(guest.campaignParticipation.potentialRevenue)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {personalizedPath ? (
                            <LinkIconButton
                              href={`${personalizedPath}?preview=1`}
                              label="Ver página"
                              icon={ExternalLink}
                            />
                          ) : (
                            <DisabledIconButton label="Página pendente" icon={ExternalLink} />
                          )}
                          <IconButton
                            label="Copiar link"
                            icon={copiedLabel === `link-${guest.id}` ? Check : Copy}
                            disabled={!personalizedPath}
                            onClick={() => copyPersonalizedLink(guest)}
                          />
                          <IconButton
                            label="Abrir WhatsApp"
                            icon={MessageCircle}
                            disabled={guest.isPlaceholder}
                            onClick={() => openWhatsapp(guest)}
                          />
                          <IconButton
                            label="Copiar mensagem"
                            icon={copiedLabel === `message-${guest.id}` ? Check : Copy}
                            disabled={guest.isPlaceholder}
                            onClick={() => copyMessage(guest)}
                          />
                          {guest.campaignParticipation.paymentLink ? (
                            <LinkIconButton
                              href={guest.campaignParticipation.paymentLink}
                              label="Link de pagamento"
                              icon={Banknote}
                            />
                          ) : (
                            <DisabledIconButton label="Pagamento pendente" icon={Banknote} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-1.5">
                          {actionStatuses.map((actionStatus) => {
                            const ActionIcon = actionIcons[actionStatus];

                            return (
                              <button
                                key={actionStatus}
                                onClick={() => setStatus(guest.id, actionStatus)}
                                disabled={guest.isPlaceholder}
                                className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 text-[11px] font-semibold text-[#D1D5DB] transition hover:border-[#C9A84C]/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <ActionIcon size={12} />
                                {shortStatusLabel(actionStatus)}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedGuest ? (
        <GuestPanel
          guest={selectedGuest}
          status={statuses[selectedGuest.id] ?? selectedGuest.campaignParticipation.status}
          onClose={() => setSelectedGuestId("")}
          onSetStatus={(status) => setStatus(selectedGuest.id, status)}
          onCopyMessage={() => copyMessage(selectedGuest)}
          onOpenWhatsapp={() => openWhatsapp(selectedGuest)}
          copiedMessage={copiedLabel === `message-${selectedGuest.id}`}
        />
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  wide = false,
}: {
  label: string;
  value: string;
  detail?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-white/[0.08] bg-[#111111] p-4 ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#8A8A8A]">{detail}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: FounderCampaignStatus }) {
  const style = statusStyles[status];

  return (
    <span
      className="inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {status}
    </span>
  );
}

function IconButton({
  label,
  icon: Icon,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-[#BDBDBD] transition hover:border-[#C9A84C]/35 hover:text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-35"
    >
      <Icon size={14} />
    </button>
  );
}

function LinkIconButton({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-[#BDBDBD] transition hover:border-[#C9A84C]/35 hover:text-[#E7C96A]"
    >
      <Icon size={14} />
    </Link>
  );
}

function DisabledIconButton({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled
      className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-[#5F5F5F]"
    >
      <Icon size={14} />
    </button>
  );
}

function GuestPanel({
  guest,
  status,
  copiedMessage,
  onClose,
  onSetStatus,
  onCopyMessage,
  onOpenWhatsapp,
}: {
  guest: FounderCampaignGuest;
  status: FounderCampaignStatus;
  copiedMessage: boolean;
  onClose: () => void;
  onSetStatus: (status: FounderCampaignStatus) => void;
  onCopyMessage: () => void;
  onOpenWhatsapp: () => void;
}) {
  const personalizedPath = guest.campaignParticipation.personalizedPagePath;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0D0D0D] shadow-2xl sm:w-[32rem]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#C9A84C]">
            <PanelRight size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Perfil comercial
            </p>
            <h2 className="text-base font-semibold text-white">{guest.name}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar perfil"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-[#A7A7A7] transition hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-lg border border-[#C9A84C]/18 bg-[#121212] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{guest.founderNumber}</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">{guest.vehicle}</p>
              <p className="mt-1 text-xs text-[#747474]">Placa: {guest.maskedPlate}</p>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ProfileFact label="Cliente desde" value={guest.customerProfile.customerSince} />
          <ProfileFact
            label="Atendimentos"
            value={
              guest.customerProfile.attendances === null
                ? "A definir"
                : String(guest.customerProfile.attendances)
            }
          />
          <ProfileFact
            label="Valor histórico"
            value={
              guest.customerProfile.historicalValue === null
                ? "A definir"
                : formatCurrency(guest.customerProfile.historicalValue)
            }
          />
          <ProfileFact label="Último atendimento" value={guest.customerProfile.lastAttendance} />
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Recomendação
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{guest.recommendedPlan}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ProfileFact label="Smart Founder" value={guest.founderConditions.smart} compact />
            <ProfileFact label="Priority Founder" value={guest.founderConditions.priority} compact />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Links e ação manual
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {personalizedPath ? (
              <Link
                href={`${personalizedPath}?preview=1`}
                target="_blank"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#C9A84C]/22 bg-[#C9A84C]/10 px-3 text-sm font-semibold text-[#E7C96A]"
              >
                <ExternalLink size={15} />
                Ver página
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 text-sm font-semibold text-[#606060]"
              >
                <ExternalLink size={15} />
                Página pendente
              </button>
            )}
            <button
              onClick={onOpenWhatsapp}
              disabled={guest.isPlaceholder}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <MessageCircle size={15} />
              Abrir WhatsApp
            </button>
            <button
              onClick={onCopyMessage}
              disabled={guest.isPlaceholder}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35 sm:col-span-2"
            >
              {copiedMessage ? <Check size={15} /> : <Copy size={15} />}
              {copiedMessage ? "Mensagem copiada" : "Copiar mensagem"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Próxima ação
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white">
            {guest.campaignParticipation.nextAction}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[#8A8A8A]">
            {guest.campaignParticipation.notes}
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Atualizar status mock
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {founders2026Statuses.map((nextStatus) => {
              const ActionIcon = actionIcons[nextStatus];

              return (
                <button
                  key={nextStatus}
                  onClick={() => onSetStatus(nextStatus)}
                  disabled={guest.isPlaceholder}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 text-xs font-semibold text-[#D1D5DB] transition hover:border-[#C9A84C]/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ActionIcon size={13} />
                  {nextStatus}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Timeline comercial
          </p>
          <div className="mt-4 space-y-3">
            {guest.campaignParticipation.commercialTimeline.map((item) => (
              <div key={`${item.title}-${item.dateLabel}`} className="flex gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#C9A84C]/18 bg-[#C9A84C]/8 text-[#C9A84C]">
                  <UserRound size={13} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8A8A8A]">{item.detail}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#5F5F5F]">
                    {item.dateLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function ProfileFact({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7D7D7D]">
        {label}
      </p>
      <p className={`mt-1 font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
        {value}
      </p>
    </div>
  );
}

function shortStatusLabel(status: FounderCampaignStatus) {
  const map: Partial<Record<FounderCampaignStatus, string>> = {
    "Convite enviado": "Convite",
    Visualizou: "Visualizou",
    Respondeu: "Respondeu",
    "Pagamento pendente": "Pgto.",
    Convertido: "Convertido",
    Perdido: "Perdido",
  };

  return map[status] ?? status;
}
