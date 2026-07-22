"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  Filter,
  MessageCircle,
  PanelRight,
  Search,
  Send,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  buildFounderWhatsappMessage,
  buildWhatsappUrl,
  commercialProfiles,
  commercialStatuses,
  DGN_OPERATIONAL_CUTOFF,
  curationProfiles,
  founderCardStatuses,
  founderKitStatuses,
  getCustomerTimeline,
  getPotentialRevenue,
  getTicketAverage,
  idealSchedules,
  maskPlate,
  maskPhone,
  originGroups,
  planMonthlyLabel,
  recommendedPlans,
  matchesDgnCustomerSearch,
  type CommercialStatus,
  type DgnCustomer,
  type FounderCardStatus,
  type FounderKitStatus,
  type FoundersPipelineStatus,
  type RecommendedPlan,
} from "@/lib/growth/dgn-growth-data";

type GrowthView = "intelligence" | "curadoria" | "founders" | "profile";
type ProfileTab = "overview" | "commercial" | "campaign" | "timeline";

type CustomerDraft = Pick<DgnCustomer, "commercialStatus" | "recommendedPlan"> & {
  commercial: NonNullable<DgnCustomer["commercial"]>;
  curation: DgnCustomer["curation"];
  campaign: DgnCustomer["campaign"];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// ============================================================================
// STATUS — 4 famílias unificadas
// ============================================================================
type StatusFamily = "neutral" | "active" | "action" | "blocked";

const statusFamily: Record<string, StatusFamily> = {
  // neutro
  "Aguardando Curadoria DGN": "neutral",
  "Nao Prioritario": "neutral",
  Selecionado: "neutral",
  "Selecionado Founder": "neutral",
  "Slot disponivel": "neutral",
  Pendente: "neutral",
  // ação/atenção
  Curado: "action",
  "Convite Criado": "action",
  "Convite criado": "action",
  "Convite Enviado": "action",
  "Mensagem enviada": "action",
  Visualizou: "action",
  Conversando: "action",
  "Pagamento Enviado": "action",
  "Pagamento enviado": "action",
  "Aguardando Kit Founder": "action",
  // ativo/positivo
  "Assinante Ativo": "active",
  "Assinante ativo": "active",
  Convertido: "active",
  // bloqueio/perda
  Perdido: "blocked",
  "Sem telefone": "blocked",
};

const statusTone: Record<StatusFamily, string> = {
  neutral: "border-white/[0.08] bg-white/[0.04] text-[#D1D5DB]",
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  action: "border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#E7C96A]",
  blocked: "border-red-400/25 bg-red-400/10 text-red-200",
};

const statusDot: Record<StatusFamily, string> = {
  neutral: "bg-[#9CA3AF]",
  active: "bg-emerald-300",
  action: "bg-[#E7C96A]",
  blocked: "bg-red-300",
};

function getStatusFamily(label: string): StatusFamily {
  return statusFamily[label] ?? "neutral";
}

// ============================================================================
// Helpers
// ============================================================================
function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getOrigin() {
  if (typeof window === "undefined") return "https://app.dgnclub.com";
  return window.location.origin;
}

function createDrafts(customers: DgnCustomer[]) {
  return Object.fromEntries(
    customers.map((customer) => [
      customer.id,
      {
        commercialStatus: customer.commercialStatus,
        recommendedPlan: customer.recommendedPlan,
        commercial: customer.commercial ?? {
          owner: "",
          commercialNotes: "",
          nextAction: customer.campaign.nextAction,
          nextActionAt: "",
          priority: "normal",
          updatedAt: "",
        },
        curation: { ...customer.curation },
        campaign: { ...customer.campaign },
      },
    ])
  ) as Record<string, CustomerDraft>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================================
// Workspace
// ============================================================================
export function DgnGrowthWorkspace({
  view,
  customerId,
  initialCustomers,
  dataOrigin,
  readOnly,
}: {
  view: GrowthView;
  customerId?: string;
  initialCustomers: DgnCustomer[];
  dataOrigin: "json" | "db" | "json-fallback";
  readOnly: boolean;
}) {
  const [drafts, setDrafts] = useState(() => createDrafts(initialCustomers));
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? initialCustomers[0]?.id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [planFilter, setPlanFilter] = useState("Todos");
  const [scoreFilter, setScoreFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState<"score" | "atendimentos" | "valor" | "ultimo">("score");
  const [founderFilter, setFounderFilter] = useState("Todos");
  const [curationFilter, setCurationFilter] = useState("Todos");
  const [notice, setNotice] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [copiedLinkKey, setCopiedLinkKey] = useState("");
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");
  const [intelligencePage, setIntelligencePage] = useState(1);
  const [curationPage, setCurationPage] = useState(1);
  const pageSize = 50;

  const customers = useMemo(
    () =>
      initialCustomers.map((customer) => ({
        ...customer,
        commercialStatus: drafts[customer.id]?.commercialStatus ?? customer.commercialStatus,
        recommendedPlan: drafts[customer.id]?.recommendedPlan ?? customer.recommendedPlan,
        commercial: drafts[customer.id]?.commercial ?? customer.commercial,
        curation: drafts[customer.id]?.curation ?? customer.curation,
        campaign: drafts[customer.id]?.campaign ?? customer.campaign,
      })),
    [drafts, initialCustomers]
  );

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];

  const visibleCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const matchesQuery = matchesDgnCustomerSearch(customer, query);
        const matchesStatus =
          statusFilter === "Todos" || customer.commercialStatus === statusFilter;
        const matchesPlan = planFilter === "Todos" || customer.recommendedPlan === planFilter;
        const matchesScore =
          scoreFilter === "Todos" ||
          (scoreFilter === "80+" && customer.scoreDgn >= 80) ||
          (scoreFilter === "90+" && customer.scoreDgn >= 90) ||
          (scoreFilter === "<80" && customer.scoreDgn < 80);

        return matchesQuery && matchesStatus && matchesPlan && matchesScore;
      })
      .sort((a, b) => {
        if (sortBy === "atendimentos") return b.washCount - a.washCount;
        if (sortBy === "valor") return b.historicalValue - a.historicalValue;
        if (sortBy === "ultimo") return b.lastAttendance.localeCompare(a.lastAttendance);
        return b.scoreDgn - a.scoreDgn;
      });
  }, [customers, planFilter, query, scoreFilter, sortBy, statusFilter]);

  const intelligencePageCount = Math.max(1, Math.ceil(visibleCustomers.length / pageSize));
  const pagedIntelligenceCustomers = visibleCustomers.slice((intelligencePage - 1) * pageSize, intelligencePage * pageSize);

  const metrics = useMemo(() => {
    const awaiting = customers.filter(
      (customer) => customer.commercialStatus === "Aguardando Curadoria DGN"
    );
    const highScore = customers.filter((customer) => customer.scoreDgn >= 80);
    const founders = customers.filter((customer) => customer.campaign.currentCampaign === "Founders 2026");
    const totalHistorical = customers.reduce((sum, customer) => sum + customer.historicalValue, 0);
    const potentialRevenue = customers.reduce(
      (sum, customer) => sum + getPotentialRevenue(customer),
      0
    );

    return {
      total: customers.length,
      historicalTotal: initialCustomers.length,
      awaiting: awaiting.length,
      highScore: highScore.length,
      founders: founders.length,
      totalHistorical,
      potentialRevenue,
    };
  }, [customers, initialCustomers.length]);

  const campaignMetrics = useMemo(() => {
    const founders = customers.filter((customer) => customer.campaign.founderSelected);
    const withPage = founders.filter((customer) => customer.campaign.personalizedPagePath);
    const sent = founders.filter((customer) =>
      ["Mensagem enviada", "Visualizou", "Conversando", "Pagamento enviado", "Assinante ativo"].includes(
        customer.campaign.campaignStatus
      )
    );
    const viewed = founders.filter((customer) => customer.campaign.campaignStatus === "Visualizou");
    const conversations = founders.filter(
      (customer) => customer.campaign.campaignStatus === "Conversando"
    );
    const payments = founders.filter(
      (customer) => customer.campaign.campaignStatus === "Pagamento enviado"
    );
    const confirmed = founders.filter((customer) => customer.campaign.founderStatus === "confirmado");
    const selected = founders.filter((customer) => customer.campaign.founderStatus === "selecionado");
    const converted = founders.filter((customer) => customer.campaign.commercialStage === "convertido");

    const awaitingKit = founders.filter(
      (customer) => customer.campaign.campaignStatus === "Aguardando Kit Founder"
    );
    const lost = founders.filter((customer) => customer.campaign.campaignStatus === "Perdido");

    return {
      available: 30 - confirmed.length,
      confirmed: confirmed.length,
      selected: selected.length,
      created: withPage.length,
      sent: sent.length,
      viewed: viewed.length,
      conversations: conversations.length,
      payments: payments.length,
      converted: converted.length,
      awaitingKit: awaitingKit.length,
      lost: lost.length,
      revenue: converted.reduce((sum, customer) => sum + getPotentialRevenue(customer), 0),
      founders,
    };
  }, [customers]);

  const patchCustomer = (id: string, patch: Partial<CustomerDraft>) => {
    if (readOnly) {
      setNotice("Persistência em implementação — nenhuma alteração foi salva.");
      window.setTimeout(() => setNotice(""), 3000);
      return;
    }
    setDrafts((current) => {
      const previous = current[id];

      return {
        ...current,
        [id]: {
          ...previous,
          ...patch,
          curation: { ...previous.curation, ...(patch.curation ?? {}) },
          campaign: { ...previous.campaign, ...(patch.campaign ?? {}) },
        },
      };
    });
  };

  const applyCommercialSaved = (
    id: string,
    commercial: NonNullable<DgnCustomer["commercial"]>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        commercial,
        campaign: {
          ...current[id].campaign,
          nextAction: commercial.nextAction,
          notes: commercial.commercialNotes,
        },
      },
    }));
  };

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1600);
  };

  const copyLink = async (customer: DgnCustomer) => {
    const path = customer.campaign.personalizedPagePath;
    if (!path) return;
    const url = `${getOrigin()}${path}`;
    await navigator.clipboard?.writeText(url);
    setCopiedLinkKey(customer.id);
    window.setTimeout(() => setCopiedLinkKey(""), 1600);
  };

  const openWhatsapp = (customer: DgnCustomer) => {
    const message = buildFounderWhatsappMessage(customer, getOrigin());
    const url = buildWhatsappUrl(customer, message);

    if (!url) {
      setNotice("Telefone não cadastrado.");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <GrowthHeader current={view} dataOrigin={dataOrigin} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {readOnly ? <div className="mb-5 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/[0.06] px-4 py-3 text-xs text-[#E7C96A]">{dataOrigin === "db" ? "Somente responsável, observação, próxima ação, data e prioridade podem ser salvos. Os demais campos continuam bloqueados." : "Fonte local somente leitura · mudanças não são salvas."}</div> : null}
        {notice ? (
          <div className="fixed right-4 top-4 z-[70] rounded-xl border border-[#C9A84C]/30 bg-[#111111] px-4 py-3 text-sm font-semibold text-[#E7C96A] shadow-2xl">
            {notice}
          </div>
        ) : null}

        {view === "intelligence" ? (
          <IntelligenceView
            metrics={metrics}
            customers={pagedIntelligenceCustomers}
            totalFiltered={visibleCustomers.length}
            page={intelligencePage}
            pageCount={intelligencePageCount}
            onPage={setIntelligencePage}
            query={query}
            statusFilter={statusFilter}
            planFilter={planFilter}
            scoreFilter={scoreFilter}
            sortBy={sortBy}
            onQuery={(value) => { setQuery(value); setIntelligencePage(1); }}
            onStatusFilter={(value) => { setStatusFilter(value); setIntelligencePage(1); }}
            onPlanFilter={(value) => { setPlanFilter(value); setIntelligencePage(1); }}
            onScoreFilter={(value) => { setScoreFilter(value); setIntelligencePage(1); }}
            onSortBy={(value) => { setSortBy(value); setIntelligencePage(1); }}
            onOpenProfile={(id) => {
              setSelectedCustomerId(id);
              setProfileTab("overview");
            }}
          />
        ) : null}

        {view === "curadoria" ? (
          <CurationView
            customers={customers}
            selectedCustomer={selectedCustomer}
            curationFilter={curationFilter}
            onSelect={setSelectedCustomerId}
            onPatch={patchCustomer}
            onCurationFilter={(value) => { setCurationFilter(value); setCurationPage(1); }}
            page={curationPage}
            pageSize={pageSize}
            onPage={setCurationPage}
          />
        ) : null}

        {view === "founders" ? (
          <FoundersView
            campaignMetrics={campaignMetrics}
            founderFilter={founderFilter}
            copiedKey={copiedKey}
            copiedLinkKey={copiedLinkKey}
            onFounderFilter={setFounderFilter}
            onOpenProfile={(id) => {
              setSelectedCustomerId(id);
              setProfileTab("overview");
            }}
            onOpenWhatsapp={openWhatsapp}
            onCopy={(customer) =>
              copyText(`message-${customer.id}`, buildFounderWhatsappMessage(customer, getOrigin()))
            }
            onCopyLink={copyLink}
          />
        ) : null}

        {view === "profile" && selectedCustomer ? (
          <CustomerProfileInline
            customer={selectedCustomer}
            tab={profileTab}
            onTabChange={setProfileTab}
            onPatch={patchCustomer}
            onOpenWhatsapp={openWhatsapp}
            onCopy={() =>
              copyText(
                `message-${selectedCustomer.id}`,
                buildFounderWhatsappMessage(selectedCustomer, getOrigin())
              )
            }
            copied={copiedKey === `message-${selectedCustomer.id}`}
            canPersistCommercial={dataOrigin === "db"}
            onCommercialSaved={applyCommercialSaved}
          />
        ) : null}
      </main>

      {view !== "profile" && selectedCustomerId ? (
        <CustomerDrawer
          customer={selectedCustomer}
          tab={profileTab}
          onTabChange={setProfileTab}
          onClose={() => setSelectedCustomerId("")}
          onPatch={patchCustomer}
          onOpenWhatsapp={openWhatsapp}
          onCopy={() =>
            copyText(
              `message-${selectedCustomer.id}`,
              buildFounderWhatsappMessage(selectedCustomer, getOrigin())
            )
          }
          copied={copiedKey === `message-${selectedCustomer.id}`}
          canPersistCommercial={dataOrigin === "db"}
          onCommercialSaved={applyCommercialSaved}
        />
      ) : null}
    </div>
  );
}

// ============================================================================
// Header
// ============================================================================
function GrowthHeader({ current, dataOrigin }: { current: GrowthView; dataOrigin: "json" | "db" | "json-fallback" }) {
  const links = [
    { href: "/admin/growth/intelligence", label: "Intelligence", view: "intelligence" },
    { href: "/admin/growth/curadoria", label: "Curadoria", view: "curadoria" },
    { href: "/admin/growth/founders-2026", label: "Founders 2026", view: "founders" },
  ];

  return (
    <header className="border-b border-white/[0.06] bg-[#0B0B0B]/95 px-4 py-6 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            DGN Growth
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Central de relacionamento
          </h1>
          <p className="mt-2 text-[11px] text-[#777]">Fonte: {dataOrigin === "db" ? "Supabase" : dataOrigin === "json-fallback" ? "JSON local temporário" : "JSON local"}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                current === link.view
                  ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#E7C96A]"
                  : "border-white/[0.06] bg-white/[0.03] text-[#D1D5DB] hover:border-[#C9A84C]/25"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/growth/logout"
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/[0.06] bg-transparent px-3 text-sm font-semibold text-[#6B6B6B] transition hover:border-red-500/30 hover:text-red-400"
          >
            Sair
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ============================================================================
// Intelligence — 4 KPIs + linha discreta financeira + filtros + tabela
// ============================================================================
function IntelligenceView({
  metrics,
  customers,
  totalFiltered,
  page,
  pageCount,
  onPage,
  query,
  statusFilter,
  planFilter,
  scoreFilter,
  sortBy,
  onQuery,
  onStatusFilter,
  onPlanFilter,
  onScoreFilter,
  onSortBy,
  onOpenProfile,
}: {
  metrics: {
    total: number;
    historicalTotal: number;
    awaiting: number;
    highScore: number;
    founders: number;
    totalHistorical: number;
    potentialRevenue: number;
  };
  customers: DgnCustomer[];
  totalFiltered: number;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  query: string;
  statusFilter: string;
  planFilter: string;
  scoreFilter: string;
  sortBy: "score" | "atendimentos" | "valor" | "ultimo";
  onQuery: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onPlanFilter: (value: string) => void;
  onScoreFilter: (value: string) => void;
  onSortBy: (value: "score" | "atendimentos" | "valor" | "ultimo") => void;
  onOpenProfile: (id: string) => void;
}) {
  const sortOptions: { key: "score" | "atendimentos" | "valor" | "ultimo"; label: string }[] = [
    { key: "score", label: "Score DGN" },
    { key: "atendimentos", label: "Atendimentos" },
    { key: "valor", label: "Valor histórico" },
    { key: "ultimo", label: "Último atend." },
  ];

  return (
    <>
      {/* 4 KPIs principais */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Base operacional" value={String(metrics.total)} icon={UserRound} />
        <MetricCard label="Aguardando curadoria" value={String(metrics.awaiting)} icon={Filter} />
        <MetricCard label="Alto score" value={String(metrics.highScore)} icon={BadgeCheck} />
        <MetricCard label="Selecionados Founder" value={String(metrics.founders)} icon={Crown} />
      </section>

      {/* Linha discreta financeira */}
      <section className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D7D7D]">
            Desde {DGN_OPERATIONAL_CUTOFF}
          </span>
          <span className="font-semibold text-white">{metrics.total} clientes</span>
        </div>
        <div className="h-4 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D7D7D]">
            Base historica
          </span>
          <span className="font-semibold text-white/80">{metrics.historicalTotal} clientes</span>
        </div>
        <div className="h-4 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D7D7D]">
            Valor historico operacional
          </span>
          <span className="font-semibold text-white">{formatCurrency(metrics.totalHistorical)}</span>
        </div>
        <div className="h-4 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D7D7D]">Potencial</span>
          <span className="font-semibold text-[#E7C96A]">
            {formatCurrency(metrics.potentialRevenue)}
          </span>
        </div>
      </section>

      <FiltersBar
        query={query}
        statusFilter={statusFilter}
        planFilter={planFilter}
        scoreFilter={scoreFilter}
        onQuery={onQuery}
        onStatusFilter={onStatusFilter}
        onPlanFilter={onPlanFilter}
        onScoreFilter={onScoreFilter}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
          Ordenar por
        </span>
        {sortOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => onSortBy(option.key)}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition ${
              sortBy === option.key
                ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#E7C96A]"
                : "border-white/[0.06] bg-white/[0.03] text-[#A7A7A7] hover:border-[#C9A84C]/25"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <CustomersTable customers={customers} total={totalFiltered} page={page} pageCount={pageCount} onPage={onPage} onOpenProfile={onOpenProfile} />
    </>
  );
}

function FiltersBar({
  query,
  statusFilter,
  planFilter,
  scoreFilter,
  onQuery,
  onStatusFilter,
  onPlanFilter,
  onScoreFilter,
}: {
  query: string;
  statusFilter: string;
  planFilter: string;
  scoreFilter: string;
  onQuery: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onPlanFilter: (value: string) => void;
  onScoreFilter: (value: string) => void;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr]">
        <label className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D7D7D]"
          />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Buscar por nome, veículo, empresa ou telefone"
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#666] focus:border-[#C9A84C]/35"
          />
        </label>
        <SelectField value={statusFilter} onChange={onStatusFilter}>
          <option>Todos</option>
          {commercialStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </SelectField>
        <SelectField value={planFilter} onChange={onPlanFilter}>
          <option>Todos</option>
          {recommendedPlans.map((plan) => (
            <option key={plan}>{plan}</option>
          ))}
        </SelectField>
        <SelectField value={scoreFilter} onChange={onScoreFilter}>
          <option>Todos</option>
          <option>90+</option>
          <option>80+</option>
          <option>{"<80"}</option>
        </SelectField>
      </div>
    </section>
  );
}

// ============================================================================
// Intelligence — tabela enxuta (colunas essenciais, nome sticky)
// ============================================================================
function CustomersTable({
  customers,
  total,
  page,
  pageCount,
  onPage,
  onOpenProfile,
}: {
  customers: DgnCustomer[];
  total: number;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  onOpenProfile: (id: string) => void;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            DGN Intelligence
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Base importada e priorizada</h2>
        </div>
        <span className="text-xs text-[#7D7D7D]">{total} resultados · até 50 por página</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-left">
              {[
                { key: "name", label: "Nome", sticky: true },
                { key: "vehicle", label: "Veículo" },
                { key: "score", label: "Score" },
                { key: "plan", label: "Plano" },
                { key: "status", label: "Status" },
                { key: "last", label: "Último" },
                { key: "action", label: "" },
              ].map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D] ${
                    column.sticky ? "sticky left-0 z-10 bg-[#101010]" : ""
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.id}
                className={`border-b border-white/[0.04] transition hover:bg-white/[0.02] ${
                  index % 2 === 1 ? "bg-white/[0.012]" : ""
                }`}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                  <button
                    onClick={() => onOpenProfile(customer.id)}
                    className="flex items-center gap-3 text-left"
                  >
                    <Avatar name={customer.name} />
                    <div>
                      <p className="text-sm font-semibold text-white">{customer.name}</p>
                      <p className="text-xs text-[#747474]">{customer.companyLink}</p>
                    </div>
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-[#E5E7EB]">{customer.vehicle}</td>
                <td className="px-4 py-3">
                  <ScorePill score={customer.scoreDgn} />
                </td>
                <td className="px-4 py-3 text-sm text-[#D1D5DB]">{customer.recommendedPlan}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={customer.commercialStatus} />
                </td>
                <td className="px-4 py-3 text-sm text-[#A7A7A7]">{customer.lastAttendance}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onOpenProfile(customer.id)}
                    className="inline-flex min-h-8 items-center gap-2 rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-3 text-xs font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/45"
                  >
                    <PanelRight size={13} />
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onPage={onPage} />
    </section>
  );
}

// ============================================================================
// Curadoria — 3 fieldsets + avatar na lista
// ============================================================================
const curationFilterOptions = [
  { key: "Todos", label: "Todos" },
  { key: "Aguardando", label: "Aguardando curadoria" },
  { key: "Curado", label: "Curado" },
  { key: "Founder", label: "Founder selecionado" },
  { key: "SemTelefone", label: "Sem telefone" },
  { key: "Revisao", label: "Revisão manual" },
] as const;

function CurationView({
  customers,
  selectedCustomer,
  curationFilter,
  onSelect,
  onPatch,
  onCurationFilter,
  page,
  pageSize,
  onPage,
}: {
  customers: DgnCustomer[];
  selectedCustomer: DgnCustomer;
  curationFilter: string;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
  onCurationFilter: (value: string) => void;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const filteredCustomers = [...customers]
    .filter((customer) => {
      if (curationFilter === "Aguardando") return customer.commercialStatus === "Aguardando Curadoria DGN";
      if (curationFilter === "Curado") return customer.commercialStatus === "Curado";
      if (curationFilter === "Founder") return customer.campaign.founderSelected;
      if (curationFilter === "SemTelefone") return customer.hasValidPhone === false;
      if (curationFilter === "Revisao") return customer.dataQualityNotes?.includes("revisao_manual") === true;
      return true;
    })
    .sort((a, b) => b.scoreDgn - a.scoreDgn);
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pagedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <div className="rounded-2xl border border-white/[0.06] bg-[#101010]">
        <div className="border-b border-white/[0.06] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Curadoria DGN
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Ordenado por Score DGN</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {curationFilterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => onCurationFilter(option.key)}
                className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold transition ${
                  curationFilter === option.key
                    ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#E7C96A]"
                    : "border-white/[0.06] bg-white/[0.025] text-[#9CA3AF] hover:border-[#C9A84C]/20"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto p-2">
          {pagedCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer.id)}
              className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${
                selectedCustomer.id === customer.id
                  ? "border-[#C9A84C]/35 bg-[#C9A84C]/10"
                  : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={customer.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{customer.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">{customer.vehicle}</p>
                      {customer.dataQualityNotes?.includes("revisao_manual") ? <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400">Revisão manual</p> : null}
                    </div>
                    <ScorePill score={customer.scoreDgn} />
                  </div>
                  <p className="mt-2 text-xs text-[#7D7D7D]">{customer.commercialStatus}</p>
                </div>
              </div>
            </button>
          ))}
          <Pagination page={page} pageCount={pageCount} onPage={onPage} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5">
        <CustomerSnapshot customer={selectedCustomer} />

        <Fieldset label="Perfil">
          <div className="grid gap-4 lg:grid-cols-2">
            <SelectBlock
              label="Perfil"
              value={selectedCustomer.curation.profile}
              options={curationProfiles}
              onChange={(value) =>
                onPatch(selectedCustomer.id, {
                  curation: { profile: value } as CustomerDraft["curation"],
                })
              }
            />
            <SelectBlock
              label="Origem / Grupo"
              value={selectedCustomer.curation.originGroup}
              options={originGroups}
              onChange={(value) =>
                onPatch(selectedCustomer.id, {
                  curation: { originGroup: value } as CustomerDraft["curation"],
                })
              }
            />
            <SelectBlock
              label="Perfil comercial"
              value={selectedCustomer.curation.commercialProfile}
              options={commercialProfiles}
              onChange={(value) =>
                onPatch(selectedCustomer.id, {
                  curation: { commercialProfile: value } as CustomerDraft["curation"],
                })
              }
            />
            <SelectBlock
              label="Plano recomendado"
              value={selectedCustomer.recommendedPlan}
              options={recommendedPlans}
              onChange={(value) =>
                onPatch(selectedCustomer.id, { recommendedPlan: value as RecommendedPlan })
              }
            />
          </div>
        </Fieldset>

        <Fieldset label="Preferência de atendimento">
          <SelectBlock
            label="Agenda ideal"
            value={selectedCustomer.curation.idealSchedule}
            options={idealSchedules}
            onChange={(value) =>
              onPatch(selectedCustomer.id, {
                curation: { idealSchedule: value } as CustomerDraft["curation"],
              })
            }
          />
        </Fieldset>

        <Fieldset label="Decisão Founder">
          <div className="grid gap-4 lg:grid-cols-2">
            <SelectBlock
              label="Decisão"
              value={selectedCustomer.curation.founderDecision}
              options={["Sim", "Nao"]}
              onChange={(value) => {
                const isFounder = value === "Sim";
                const founderNumber =
                  selectedCustomer.curation.founderNumber ||
                  String(
                    1 +
                      customers.filter((customer) => customer.campaign.founderSelected).length
                  ).padStart(3, "0");

                onPatch(selectedCustomer.id, {
                  commercialStatus: isFounder ? "Selecionado Founder" : "Curado",
                  curation: {
                    founderDecision: value,
                    founderNumber: isFounder ? founderNumber : "",
                  } as CustomerDraft["curation"],
                  campaign: {
                    currentCampaign: isFounder ? "Founders 2026" : "",
                    founderSelected: isFounder,
                    founderNumber: isFounder ? founderNumber : "",
                    founderCondition: isFounder
                      ? planMonthlyLabel[selectedCustomer.recommendedPlan]
                      : "",
                    campaignStatus: isFounder ? "Selecionado" : "",
                    lastAction: isFounder ? "Selecionado para Founders 2026" : "Curadoria realizada",
                    nextAction: isFounder ? "Criar convite personalizado" : "Manter relacionamento",
                  } as CustomerDraft["campaign"],
                });
              }}
            />
            <label>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
                Número Founder
              </span>
              <input
                value={selectedCustomer.curation.founderNumber}
                onChange={(event) =>
                  onPatch(selectedCustomer.id, {
                    curation: { founderNumber: event.target.value } as CustomerDraft["curation"],
                    campaign: { founderNumber: event.target.value } as CustomerDraft["campaign"],
                  })
                }
                placeholder="001 a 030"
                className="mt-2 h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-[#666] focus:border-[#C9A84C]/35"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
              Observações internas
            </span>
            <textarea
              value={selectedCustomer.curation.internalNotes}
              onChange={(event) =>
                onPatch(selectedCustomer.id, {
                  curation: { internalNotes: event.target.value } as CustomerDraft["curation"],
                })
              }
              rows={4}
              placeholder="Contexto, sensibilidade a preço, quem indicou, observações relevantes…"
              className="mt-2 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-[#5F5F5F] focus:border-[#C9A84C]/35"
            />
          </label>
        </Fieldset>
      </div>
    </section>
  );
}

function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-[#A7A7A7]">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-white/[0.08] px-3 py-2 disabled:opacity-30">Anterior</button>
      <span>Página {page} de {pageCount}</span>
      <button disabled={page >= pageCount} onClick={() => onPage(page + 1)} className="rounded-lg border border-white/[0.08] px-3 py-2 disabled:opacity-30">Próxima</button>
    </div>
  );
}

function Fieldset({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6 border-t border-white/[0.06] pt-5">
      <legend className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

// ============================================================================
// Founders 2026 — hero + funil compacto + tabela essencial
// ============================================================================
const founderFilterOptions = [
  { key: "Todos", label: "Todos" },
  { key: "Ativo", label: "Ativos" },
  { key: "SemConvite", label: "Sem convite" },
  { key: "Visualizou", label: "Visualizaram" },
  { key: "AguardandoKit", label: "Aguardando kit" },
  { key: "Perdido", label: "Perdidos" },
] as const;

function FoundersView({
  campaignMetrics,
  founderFilter,
  copiedKey,
  copiedLinkKey,
  onFounderFilter,
  onOpenProfile,
  onOpenWhatsapp,
  onCopy,
  onCopyLink,
}: {
  campaignMetrics: {
    available: number;
    confirmed: number;
    selected: number;
    created: number;
    sent: number;
    viewed: number;
    conversations: number;
    payments: number;
    converted: number;
    awaitingKit: number;
    lost: number;
    revenue: number;
    founders: DgnCustomer[];
  };
  founderFilter: string;
  copiedKey: string;
  copiedLinkKey: string;
  onFounderFilter: (value: string) => void;
  onOpenProfile: (id: string) => void;
  onOpenWhatsapp: (customer: DgnCustomer) => void;
  onCopy: (customer: DgnCustomer) => void;
  onCopyLink: (customer: DgnCustomer) => void;
}) {
  const allFounderRows = [
    ...campaignMetrics.founders,
    ...(false ? Array.from({ length: Math.max(0, 30 - campaignMetrics.founders.length) }, (_, index) => {
      const number = String(campaignMetrics.founders.length + index + 1).padStart(3, "0");

      return {
        id: `slot-${number}`,
        name: `Founder ${number}`,
        vehicle: "A definir",
        plate: "",
        phone: "",
        scoreDgn: 0,
        recommendedPlan: "Smart" as RecommendedPlan,
        commercialStatus: "Aguardando Curadoria DGN" as CommercialStatus,
        campaign: {
          founderNumber: number,
          founderCondition: "A definir",
          campaignStatus: "Selecionado" as FoundersPipelineStatus,
          personalizedPagePath: "",
          paymentLink: "",
          lastAction: "Slot disponível",
          nextAction: "Selecionar cliente na Curadoria DGN",
          notes: "Slot reservado para completar os 30 Founders.",
          founderSelected: false,
          kitStatus: "" as FounderKitStatus,
          cardStatus: "" as FounderCardStatus,
        },
        isSlot: true,
      };
    }) : []),
  ] as DgnCustomer[];

  const founderRows = allFounderRows.filter((row) => {
    const customer = row as DgnCustomer & { isSlot?: boolean };
    if (founderFilter === "Ativo") return customer.campaign.campaignStatus === "Assinante ativo";
    if (founderFilter === "SemConvite") return !customer.campaign.personalizedPagePath && !customer.isSlot;
    if (founderFilter === "Visualizou") return customer.campaign.campaignStatus === "Visualizou";
    if (founderFilter === "AguardandoKit") return customer.campaign.campaignStatus === "Aguardando Kit Founder";
    if (founderFilter === "Perdido") return customer.campaign.campaignStatus === "Perdido";
    return true;
  });

  const goalPercentage = Math.round((campaignMetrics.confirmed / 30) * 100);
  const operationalGroups = [
    ["Prontos para convite", allFounderRows.filter((c) => c.campaign.commercialStage === "pronto_para_contato")],
    ["Precisam de validação", allFounderRows.filter((c) => ["nao_avaliado", "recomendado", "selecionado"].includes(c.campaign.founderStatus ?? "nao_avaliado") && c.campaign.commercialStage === "aguardando_analise")],
    ["Em andamento", allFounderRows.filter((c) => ["contato_preparado", "contatado", "visualizou", "respondeu", "conversando", "pagamento_enviado"].includes(c.campaign.commercialStage ?? ""))],
    ["Convertidos", allFounderRows.filter((c) => c.campaign.commercialStage === "convertido")],
    ["Lista de espera", allFounderRows.filter((c) => c.campaign.founderStatus === "lista_espera")],
    ["Bloqueados / perdidos", allFounderRows.filter((c) => c.campaign.founderStatus === "descartado" || c.campaign.commercialStage === "descartado")],
  ] as const;
  const todayContacts = [...allFounderRows]
    .filter((c) => c.commercial?.nextActionAt && !["convertido", "descartado"].includes(c.campaign.commercialStage ?? ""))
    .sort((a, b) => new Date(a.commercial!.nextActionAt).getTime() - new Date(b.commercial!.nextActionAt).getTime() || b.scoreDgn - a.scoreDgn)
    .slice(0, 8);

  return (
    <>
      {/* HERO da campanha */}
      <section
        className="relative overflow-hidden rounded-3xl border border-[#C9A84C]/25 p-6 sm:p-8"
        style={{
          background: "linear-gradient(145deg,#1A1408 0%,#0B0B0B 65%,#0F0D06 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 85% 0%, rgba(201,168,76,0.18), transparent 40%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Founders 2026
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <p className="gold-gradient-text text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
                {campaignMetrics.confirmed}
              </p>
              <p className="text-2xl font-semibold text-white/60">/ 30</p>
            </div>
            <p className="mt-2 text-sm text-[#B8B8B8]">assinaturas semestrais confirmadas</p>
          </div>

          <div className="lg:w-96">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
              <span>Progresso · meta 30</span>
              <span className="text-[#E7C96A]">{goalPercentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#C9A84C,#F0D060)]"
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Banknote size={14} className="text-[#C9A84C]" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#7D7D7D]">
                Receita confirmada
              </span>
              <span className="text-sm font-semibold text-white">
                {formatCurrency(campaignMetrics.revenue)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {operationalGroups.map(([label, rows]) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{rows.length}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Quem contatar hoje</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {todayContacts.length ? todayContacts.map((customer) => (
            <button key={customer.id} onClick={() => onOpenProfile(customer.id)} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-left">
              <span className="text-sm font-semibold text-white">{customer.name}</span>
              <span className="ml-2 text-xs text-[#C9A84C]">Score {customer.scoreDgn}</span>
              <p className="mt-1 text-xs text-[#8A8A8A]">{customer.commercial?.nextAction} · {customer.commercial?.owner || "Sem responsável"}</p>
            </button>
          )) : <p className="text-sm text-[#777]">Nenhuma próxima ação agendada.</p>}
        </div>
      </section>

      {/* FUNIL compacto — 5 estágios */}
      <section className="mt-4">
        <Funnel
          stages={[
            { label: "Convidados", value: campaignMetrics.sent, family: "action" },
            { label: "Visualizaram", value: campaignMetrics.viewed, family: "action" },
            { label: "Conversando", value: campaignMetrics.conversations, family: "action" },
            { label: "Pagamento", value: campaignMetrics.payments, family: "action" },
            { label: "Convertidos", value: campaignMetrics.converted, family: "active" },
          ]}
        />
      </section>

      {/* Tabela essencial */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Membros Fundadores DGN Club
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Pipeline dos 30 convites</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {founderFilterOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => onFounderFilter(option.key)}
                  className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold transition ${
                    founderFilter === option.key
                      ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#E7C96A]"
                      : "border-white/[0.06] bg-white/[0.025] text-[#9CA3AF] hover:border-[#C9A84C]/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                {[
                  { key: "num", label: "Nº" },
                  { key: "name", label: "Nome", sticky: true },
                  { key: "vehicle", label: "Veículo" },
                  { key: "status", label: "Status" },
                  { key: "actions_flow", label: "Última / próxima ação" },
                  { key: "actions", label: "Ações" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D] ${
                      column.sticky ? "sticky left-0 z-10 bg-[#101010]" : ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {founderRows.map((row, index) => {
                const customer = row as DgnCustomer & { isSlot?: boolean };
                const isSlot = customer.isSlot;
                const status = customer.campaign.campaignStatus || "Selecionado";

                return (
                  <tr
                    key={customer.id}
                    className={`border-b border-white/[0.04] transition hover:bg-white/[0.02] ${
                      index % 2 === 1 ? "bg-white/[0.012]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/22 bg-[#C9A84C]/8 px-2.5 py-1 text-xs font-semibold text-[#E7C96A]">
                        <Crown size={12} />
                        {customer.campaign.founderNumber || "000"}
                      </span>
                    </td>
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                      <button
                        disabled={isSlot}
                        onClick={() => onOpenProfile(customer.id)}
                        className="flex items-center gap-3 text-left disabled:cursor-not-allowed"
                      >
                        {isSlot ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-white/[0.12] text-[#4B5563]">
                            <Crown size={13} />
                          </div>
                        ) : (
                          <Avatar name={customer.name} />
                        )}
                        <div>
                          <span className="block text-sm font-semibold text-white">
                            {customer.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#747474]">
                            {isSlot ? "Slot interno" : customer.companyLink}
                          </span>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#E5E7EB]">{customer.vehicle}</td>
                    <td className="px-4 py-3">
                      {isSlot ? (
                        <StatusBadge label="Slot disponivel" />
                      ) : (
                        <button onClick={() => onOpenProfile(customer.id)} title="Alterar no perfil persistente">
                          <StatusBadge label={`${customer.campaign.founderStatus ?? "nao_avaliado"} · ${status}`} />
                        </button>
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="text-xs font-semibold text-white">{customer.campaign.lastAction}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#8A8A8A]">
                        {customer.campaign.nextAction}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <IconButton
                          label="Abrir perfil"
                          icon={PanelRight}
                          disabled={isSlot}
                          onClick={() => onOpenProfile(customer.id)}
                        />
                        <IconButton
                          label="Abrir WhatsApp"
                          icon={MessageCircle}
                          disabled={isSlot}
                          onClick={() => onOpenWhatsapp(customer)}
                          highlight="green"
                        />
                        <IconButton
                          label="Copiar mensagem"
                          icon={copiedKey === `message-${customer.id}` ? Check : Copy}
                          disabled={isSlot}
                          onClick={() => onCopy(customer)}
                        />
                        <IconButton
                          label={copiedLinkKey === customer.id ? "Link copiado" : "Copiar link"}
                          icon={copiedLinkKey === customer.id ? Check : ExternalLink}
                          disabled={isSlot || !customer.campaign.personalizedPagePath}
                          onClick={() => onCopyLink(customer)}
                        />
                        {customer.campaign.paymentLink ? (
                          <Link
                            href={customer.campaign.paymentLink}
                            target="_blank"
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#BDBDBD] transition hover:border-[#C9A84C]/35 hover:text-[#E7C96A]"
                            title="Link de pagamento"
                            aria-label="Link de pagamento"
                          >
                            <Banknote size={13} />
                          </Link>
                        ) : (
                          <IconButton label="Pagamento pendente" icon={Banknote} disabled onClick={() => {}} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ============================================================================
// Funnel compacto — 5 estágios com setas
// ============================================================================
function Funnel({
  stages,
}: {
  stages: { label: string; value: number; family: StatusFamily }[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
      <div className="grid gap-2 sm:grid-cols-5">
        {stages.map((stage, index) => (
          <div
            key={stage.label}
            className="relative rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${statusDot[stage.family]}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                {stage.label}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{stage.value}</p>
            {index < stages.length - 1 ? (
              <ArrowRight
                size={14}
                className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-[#4B5563] sm:block"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Drawer + Profile Inline + Tabs
// ============================================================================
function CustomerDrawer({
  customer,
  tab,
  copied,
  onTabChange,
  onClose,
  onPatch,
  onOpenWhatsapp,
  onCopy,
  canPersistCommercial,
  onCommercialSaved,
}: {
  customer: DgnCustomer;
  tab: ProfileTab;
  copied: boolean;
  onTabChange: (tab: ProfileTab) => void;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
  onOpenWhatsapp: (customer: DgnCustomer) => void;
  onCopy: () => void;
  canPersistCommercial: boolean;
  onCommercialSaved: (id: string, commercial: NonNullable<DgnCustomer["commercial"]>) => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/[0.06] bg-[#0D0D0D] shadow-2xl sm:w-[36rem]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
              Perfil individual
            </p>
            <h2 className="text-base font-semibold text-white">{customer.name}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar perfil"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#A7A7A7] transition hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <CustomerProfileInline
          customer={customer}
          tab={tab}
          onTabChange={onTabChange}
          copied={copied}
          onPatch={onPatch}
          onOpenWhatsapp={onOpenWhatsapp}
          onCopy={onCopy}
          canPersistCommercial={canPersistCommercial}
          onCommercialSaved={onCommercialSaved}
        />
      </div>

      {/* CTA fixo no rodapé */}
      <div className="border-t border-white/[0.06] bg-[#0B0B0B] px-5 py-4">
        <button
          onClick={() => onOpenWhatsapp(customer)}
          disabled={!customer.phone}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E]/12 border border-[#22C55E]/25 text-sm font-semibold text-[#4ADE80] transition hover:bg-[#22C55E]/16 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MessageCircle size={16} />
          {customer.phone ? "Abrir WhatsApp" : "Telefone não cadastrado"}
        </button>
      </div>
    </aside>
  );
}

const profileTabs: { key: ProfileTab; label: string }[] = [
  { key: "overview", label: "Visão geral" },
  { key: "commercial", label: "Comercial" },
  { key: "campaign", label: "Campanha" },
  { key: "timeline", label: "Timeline" },
];

function CustomerProfileInline({
  customer,
  tab,
  copied,
  onTabChange,
  onPatch,
  onOpenWhatsapp,
  onCopy,
  canPersistCommercial,
  onCommercialSaved,
}: {
  customer: DgnCustomer;
  tab: ProfileTab;
  copied: boolean;
  onTabChange: (tab: ProfileTab) => void;
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
  onOpenWhatsapp: (customer: DgnCustomer) => void;
  onCopy: () => void;
  canPersistCommercial: boolean;
  onCommercialSaved: (id: string, commercial: NonNullable<DgnCustomer["commercial"]>) => void;
}) {
  const timeline = getCustomerTimeline(customer);

  return (
    <div>
      <CustomerSnapshot customer={customer} />

      <div className="mt-5 flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] pb-3">
        {profileTabs.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition ${
              tab === item.key
                ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#E7C96A]"
                : "border-white/[0.06] bg-white/[0.03] text-[#9CA3AF] hover:border-[#C9A84C]/25"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ProfileFact label="Ticket médio" value={formatCurrency(getTicketAverage(customer))} />
          <ProfileFact
            label="Intervalo médio"
            value={
              customer.averageVisitIntervalDays
                ? `${customer.averageVisitIntervalDays} dias`
                : "A validar"
            }
          />
          <ProfileFact
            label="Campanha atual"
            value={customer.campaign.currentCampaign || "Sem campanha ativa"}
          />
          <ProfileFact
            label="Founder"
            value={customer.campaign.founderSelected ? `Sim · ${customer.campaign.founderNumber}` : "Não"}
          />
          <ProfileFact label="Telefone" value={maskPhone(customer.phone)} />
          <ProfileFact label="Placa" value={maskPlate(customer.plate)} />
          <ProfileFact label="Empresa / vínculo" value={customer.companyLink || "—"} />
          <ProfileFact label="Origem" value={customer.origin || "—"} />
        </div>
      ) : null}

      {tab === "commercial" ? (
        <div className="mt-4 space-y-3">
          <CommercialEditor
            key={customer.id}
            customer={customer}
            enabled={canPersistCommercial}
            onSaved={onCommercialSaved}
          />
          <div className="rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
              Links e mensagem
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {customer.campaign.personalizedPagePath ? (
                <Link
                  href={customer.campaign.personalizedPagePath}
                  target="_blank"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-3 text-sm font-semibold text-[#E7C96A]"
                >
                  <ExternalLink size={15} />
                  Página personalizada
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 text-sm font-semibold text-[#606060]"
                >
                  <ExternalLink size={15} />
                  Página pendente
                </button>
              )}
              <button
                onClick={() => onOpenWhatsapp(customer)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm font-semibold text-white"
              >
                <MessageCircle size={15} />
                Abrir WhatsApp
              </button>
              <button
                onClick={onCopy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm font-semibold text-white sm:col-span-2"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Mensagem copiada" : "Copiar mensagem"}
              </button>
            </div>
          </div>

        </div>
      ) : null}

      {tab === "campaign" ? (
        <div className="mt-4 space-y-3">
          <CampaignPipelineEditor customer={customer} enabled={canPersistCommercial} />
          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileFact
              label="Campanha atual"
              value={customer.campaign.currentCampaign || "Sem campanha ativa"}
            />
            <ProfileFact
              label="Founder"
              value={customer.campaign.founderSelected ? `Sim · ${customer.campaign.founderNumber}` : "Não"}
            />
            <ProfileFact
              label="Condição Founder"
              value={customer.campaign.founderCondition || "A definir"}
            />
            <ProfileFact label="Última ação" value={customer.campaign.lastAction || "—"} />
          </div>

          {customer.campaign.founderSelected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectBlock
                label="Status Kit Founder"
                value={customer.campaign.kitStatus || ""}
                options={founderKitStatuses}
                onChange={(value) =>
                  onPatch(customer.id, {
                    campaign: { kitStatus: value as FounderKitStatus } as CustomerDraft["campaign"],
                  })
                }
              />
              <SelectBlock
                label="Status Cartão Founder"
                value={customer.campaign.cardStatus || ""}
                options={founderCardStatuses}
                onChange={(value) =>
                  onPatch(customer.id, {
                    campaign: { cardStatus: value as FounderCardStatus } as CustomerDraft["campaign"],
                  })
                }
              />
            </div>
          ) : null}

          <ProfileInput
            label="Próxima ação"
            value={customer.campaign.nextAction}
            onChange={(value) =>
              onPatch(customer.id, {
                campaign: { nextAction: value } as CustomerDraft["campaign"],
              })
            }
          />
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
              Observações internas
            </span>
            <textarea
              rows={3}
              value={customer.campaign.notes}
              onChange={(event) =>
                onPatch(customer.id, {
                  campaign: { notes: event.target.value } as CustomerDraft["campaign"],
                })
              }
              placeholder="Contexto, objeções, próximo passo…"
              className="mt-2 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-[#5F5F5F] focus:border-[#C9A84C]/35"
            />
          </label>
        </div>
      ) : null}

      {tab === "timeline" ? (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#101010] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">
            Timeline comercial
          </p>
          <div className="mt-4 space-y-3">
            {timeline.map((item) => (
              <div key={`${item.title}-${item.dateLabel}`} className="flex gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
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
      ) : null}
    </div>
  );
}

function CampaignPipelineEditor({ customer, enabled }: { customer: DgnCustomer; enabled: boolean }) {
  const campaign = customer.campaign;
  const [founderStatus, setFounderStatus] = useState(campaign.founderStatus ?? "nao_avaliado");
  const [stage, setStage] = useState(campaign.commercialStage ?? "aguardando_analise");
  const [founderNumber, setFounderNumber] = useState(campaign.founderNumber ?? "");
  const [selectionReason, setSelectionReason] = useState(campaign.selectionReason ?? "");
  const [lostReason, setLostReason] = useState(campaign.lostReason ?? "");
  const [kitStatus, setKitStatus] = useState(campaign.kitStatusRaw ?? "nao_aplicavel");
  const [cardStatus, setCardStatus] = useState(campaign.cardStatusRaw ?? "nao_aplicavel");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!enabled || !campaign.updatedAt) return;
    const oldOrder = ["aguardando_analise", "pronto_para_contato", "contato_preparado", "contatado", "visualizou", "respondeu", "conversando", "pagamento_enviado", "convertido", "descartado"];
    const backwards = oldOrder.indexOf(stage) < oldOrder.indexOf(campaign.commercialStage ?? "aguardando_analise");
    const transitionReason = backwards ? window.prompt("Motivo obrigatório para voltar a etapa:")?.trim() : "";
    if (backwards && !transitionReason) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch(`/api/admin/growth/customers/${encodeURIComponent(customer.id)}/campaign`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId: "founders-2026", founderStatus, commercialStage: stage,
          founderNumber: founderStatus === "confirmado" ? founderNumber : "", selectionReason,
          lostReason, kitStatus, cardStatus, expectedUpdatedAt: campaign.updatedAt,
          transitionReason: transitionReason || undefined, confirmBackward: backwards }),
      });
      const result = await response.json() as { changed?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "Falha ao salvar pipeline.");
      setNotice(result.changed ? "Pipeline salvo. Recarregando…" : "Nenhuma alteração; histórico preservado.");
      if (result.changed) window.setTimeout(() => window.location.reload(), 500);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Falha ao salvar pipeline."); }
    finally { setSaving(false); }
  }

  const founderOptions = ["nao_avaliado", "recomendado", "selecionado", "confirmado", "lista_espera", "descartado"];
  const stageOptions = ["aguardando_analise", "pronto_para_contato", "contato_preparado", "contatado", "visualizou", "respondeu", "conversando", "pagamento_enviado", "convertido", "descartado"];
  return <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#101010] p-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Pipeline persistente</p><p className="mt-1 text-xs text-[#8A8A8A]">Alterações manuais, auditadas e protegidas por versão.</p></div><button disabled={!enabled || saving} onClick={save} className="rounded-xl bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-black disabled:opacity-40">{saving ? "Salvando…" : "Salvar pipeline"}</button></div>
    {notice ? <p className="mt-3 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-[#E7C96A]">{notice}</p> : null}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <SelectBlock label="Status Founder" value={founderStatus} options={founderOptions} onChange={(value) => setFounderStatus(value as typeof founderStatus)} />
      <SelectBlock label="Etapa comercial" value={stage} options={stageOptions} onChange={(value) => setStage(value as typeof stage)} />
      <ProfileInput label="Número Founder (somente confirmado)" value={founderNumber} onChange={setFounderNumber} placeholder="001" />
      <ProfileInput label="Motivo da seleção/confirmação" value={selectionReason} onChange={setSelectionReason} placeholder="Decisão humana obrigatória" />
      <SelectBlock label="Kit" value={kitStatus} options={["nao_aplicavel", "pendente", "em_preparacao", "pronto", "entregue"]} onChange={(value) => setKitStatus(value as typeof kitStatus)} />
      <SelectBlock label="Cartão" value={cardStatus} options={["nao_aplicavel", "pendente", "solicitado", "produzido", "entregue"]} onChange={(value) => setCardStatus(value as typeof cardStatus)} />
      <div className="sm:col-span-2"><ProfileInput label="Motivo de perda/descarte" value={lostReason} onChange={setLostReason} placeholder="Obrigatório ao descartar" /></div>
    </div>
    <p className="mt-3 text-[11px] text-[#696969]">Abrir WhatsApp não altera etapa, envio, visualização ou resposta.</p>
  </div>;
}

function toLocalDateTimeInput(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function CommercialEditor({
  customer,
  enabled,
  onSaved,
}: {
  customer: DgnCustomer;
  enabled: boolean;
  onSaved: (id: string, commercial: NonNullable<DgnCustomer["commercial"]>) => void;
}) {
  const current = customer.commercial ?? {
    owner: "",
    commercialNotes: "",
    nextAction: "",
    nextActionAt: "",
    priority: "normal" as const,
    updatedAt: "",
  };
  const [form, setForm] = useState({
    owner: current.owner,
    commercialNotes: current.commercialNotes,
    nextAction: current.nextAction,
    nextActionAt: toLocalDateTimeInput(current.nextActionAt),
    priority: current.priority,
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const save = async () => {
    if (!enabled || saving) return;
    if (!current.updatedAt) {
      setResult({ tone: "error", message: "Recarregue a página antes de salvar." });
      return;
    }
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch(`/api/admin/growth/customers/${encodeURIComponent(customer.id)}/commercial`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nextActionAt: form.nextActionAt ? new Date(form.nextActionAt).toISOString() : "",
          expectedUpdatedAt: current.updatedAt,
        }),
      });
      const body = await response.json() as { error?: string; changed?: boolean; commercial?: NonNullable<DgnCustomer["commercial"]> };
      if (!response.ok || !body.commercial) throw new Error(body.error || "Falha ao salvar.");
      onSaved(customer.id, body.commercial);
      setResult({
        tone: "success",
        message: body.changed ? "Campos comerciais salvos." : "Nenhuma alteração necessária.",
      });
    } catch (error) {
      setResult({ tone: "error", message: error instanceof Error ? error.message : "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-2 h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-45 focus:border-[#C9A84C]/35";
  const labelClass = "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]";

  return (
    <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#101010] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]/80">Gestão comercial</p>
          <p className="mt-1 text-xs text-[#777]">Únicos campos com persistência ativa nesta etapa.</p>
        </div>
        <span className="rounded-full border border-white/[0.08] px-2 py-1 text-[10px] text-[#888]">{enabled ? "DB" : "Somente leitura"}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label><span className={labelClass}>Responsável</span><input disabled={!enabled} maxLength={80} value={form.owner} onChange={(event) => setForm((state) => ({ ...state, owner: event.target.value }))} className={inputClass} /></label>
        <label><span className={labelClass}>Prioridade</span><select disabled={!enabled} value={form.priority} onChange={(event) => setForm((state) => ({ ...state, priority: event.target.value as typeof state.priority }))} className={inputClass}><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
        <label><span className={labelClass}>Próxima ação</span><input disabled={!enabled} maxLength={240} value={form.nextAction} onChange={(event) => setForm((state) => ({ ...state, nextAction: event.target.value }))} className={inputClass} /></label>
        <label><span className={labelClass}>Data da próxima ação</span><input disabled={!enabled} type="datetime-local" value={form.nextActionAt} onChange={(event) => setForm((state) => ({ ...state, nextActionAt: event.target.value }))} className={inputClass} /></label>
      </div>
      <label className="mt-3 block"><span className={labelClass}>Observação comercial</span><textarea disabled={!enabled} maxLength={2000} rows={4} value={form.commercialNotes} onChange={(event) => setForm((state) => ({ ...state, commercialNotes: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-45 focus:border-[#C9A84C]/35" /></label>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${result?.tone === "error" ? "text-red-300" : "text-emerald-300"}`}>{result?.message}</p>
        <button type="button" disabled={!enabled || saving} onClick={save} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 text-sm font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Salvando…" : "Salvar campos comerciais"}</button>
      </div>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-[#5F5F5F] focus:border-[#C9A84C]/35"
      />
    </label>
  );
}

function CustomerSnapshot({ customer }: { customer: DgnCustomer }) {
  const incompleteRegistration = customer.dataQualityStatus !== "ok";

  return (
    <div className="rounded-2xl border border-[#C9A84C]/18 bg-[#121212] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-semibold text-white sm:text-2xl">{customer.name}</p>
              {incompleteRegistration ? (
                <span className="inline-flex h-6 items-center rounded-full border border-red-400/25 bg-red-400/10 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300">
                  Cadastro incompleto
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[#A7A7A7]">
              {customer.vehicle} · {maskPlate(customer.plate)}
            </p>
            <p className="mt-0.5 text-sm text-[#A7A7A7]">
              {customer.companyLink} · {customer.origin}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScorePill score={customer.scoreDgn} />
          <StatusBadge label={customer.commercialStatus} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileFact label="Atendimentos" value={String(customer.washCount)} compact />
        <ProfileFact label="Recorrência" value={customer.recurrence} compact />
        <ProfileFact label="Valor investido" value={formatCurrency(customer.historicalValue)} compact />
        <ProfileFact label="Último atendimento" value={customer.lastAttendance} compact />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ProfileFact label="Plano sugerido" value={customer.recommendedPlan} compact />
        <ProfileFact label="Cliente desde" value={customer.customerSince} compact />
      </div>
    </div>
  );
}

// ============================================================================
// Primitives
// ============================================================================
function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
          {label}
        </p>
        <Icon size={16} className="text-[#C9A84C]" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
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
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7D7D7D]">
        {label}
      </p>
      <p className={`mt-1 font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
        {value}
      </p>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span className="inline-flex min-h-7 min-w-12 items-center justify-center rounded-full border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-2.5 text-xs font-semibold text-[#E7C96A]">
      {score || "-"}
    </span>
  );
}

function StatusBadge({ label }: { label: string }) {
  const family = getStatusFamily(label);
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${statusTone[family]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[family]}`} />
      {label}
    </span>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = getInitials(name);
  const dim = size === "lg" ? "h-14 w-14 text-base" : "h-9 w-9 text-[11px]";
  return (
    <div
      className={`flex ${dim} items-center justify-center rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 font-semibold text-[#E7C96A]`}
    >
      {initials}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-white/[0.06] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/35"
    >
      {children}
    </select>
  );
}

function SelectBlock<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly T[] | string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
        {label}
      </span>
      <SelectField value={value} onChange={onChange}>
        <option value="">A definir</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </SelectField>
    </label>
  );
}

function IconButton({
  label,
  icon: Icon,
  disabled = false,
  onClick,
  highlight,
}: {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
  highlight?: "green";
}) {
  const highlightClass =
    highlight === "green"
      ? "hover:border-[#22C55E]/35 hover:text-[#4ADE80]"
      : "hover:border-[#C9A84C]/35 hover:text-[#E7C96A]";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#BDBDBD] transition disabled:cursor-not-allowed disabled:opacity-35 ${highlightClass}`}
    >
      <Icon size={13} />
    </button>
  );
}

// ============================================================================
// Mapping helpers
// ============================================================================
function mapCampaignToCommercial(status: FoundersPipelineStatus): CommercialStatus {
  const map: Record<FoundersPipelineStatus, CommercialStatus> = {
    Selecionado: "Selecionado Founder",
    "Convite criado": "Convite Criado",
    "Mensagem enviada": "Convite Enviado",
    Visualizou: "Visualizou",
    Conversando: "Conversando",
    "Pagamento enviado": "Pagamento Enviado",
    "Assinante ativo": "Assinante Ativo",
    "Aguardando Kit Founder": "Aguardando Kit Founder",
    Perdido: "Perdido",
  };

  return map[status];
}

function nextActionForCampaign(status: FoundersPipelineStatus) {
  const map: Record<FoundersPipelineStatus, string> = {
    Selecionado: "Criar convite personalizado",
    "Convite criado": "Enviar mensagem manual",
    "Mensagem enviada": "Acompanhar visualização e resposta",
    Visualizou: "Chamar para confirmar interesse",
    Conversando: "Enviar link de pagamento",
    "Pagamento enviado": "Acompanhar confirmação",
    "Assinante ativo": "Preparar kit Founder",
    "Aguardando Kit Founder": "Entregar kit e registrar boas-vindas",
    Perdido: "Registrar motivo e encerrar campanha",
  };

  return map[status];
}
