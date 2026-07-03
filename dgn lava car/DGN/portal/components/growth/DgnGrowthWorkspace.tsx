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
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  buildFounderWhatsappMessage,
  buildWhatsappUrl,
  commercialProfiles,
  commercialStatuses,
  curationProfiles,
  dgnCustomers,
  foundersPipelineStatuses,
  getCustomerTimeline,
  getPotentialRevenue,
  getTicketAverage,
  idealSchedules,
  maskPlate,
  originGroups,
  planMonthlyLabel,
  recommendedPlans,
  type CommercialStatus,
  type DgnCustomer,
  type FoundersPipelineStatus,
  type RecommendedPlan,
} from "@/lib/growth/dgn-growth-data";

type GrowthView = "intelligence" | "curadoria" | "founders" | "profile";

type CustomerDraft = Pick<DgnCustomer, "commercialStatus" | "recommendedPlan"> & {
  curation: DgnCustomer["curation"];
  campaign: DgnCustomer["campaign"];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusTone: Record<string, string> = {
  "Aguardando Curadoria DGN": "border-white/[0.08] bg-white/[0.035] text-[#D1D5DB]",
  Curado: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  "Selecionado Founder": "border-[#C9A84C]/24 bg-[#C9A84C]/10 text-[#E7C96A]",
  "Convite Criado": "border-amber-300/20 bg-amber-300/10 text-amber-200",
  "Convite Enviado": "border-blue-300/20 bg-blue-300/10 text-blue-200",
  Visualizou: "border-violet-300/20 bg-violet-300/10 text-violet-200",
  Conversando: "border-teal-300/20 bg-teal-300/10 text-teal-200",
  "Pagamento Enviado": "border-orange-300/20 bg-orange-300/10 text-orange-200",
  "Assinante Ativo": "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  "Aguardando Kit Founder": "border-lime-300/20 bg-lime-300/10 text-lime-200",
  Perdido: "border-red-300/20 bg-red-300/10 text-red-200",
  "Nao Prioritario": "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
  Selecionado: "border-[#C9A84C]/24 bg-[#C9A84C]/10 text-[#E7C96A]",
  "Convite criado": "border-amber-300/20 bg-amber-300/10 text-amber-200",
  "Mensagem enviada": "border-blue-300/20 bg-blue-300/10 text-blue-200",
  "Pagamento enviado": "border-orange-300/20 bg-orange-300/10 text-orange-200",
  "Assinante ativo": "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getOrigin() {
  if (typeof window === "undefined") return "https://app.dgnclub.com";
  return window.location.origin;
}

function createDrafts() {
  return Object.fromEntries(
    dgnCustomers.map((customer) => [
      customer.id,
      {
        commercialStatus: customer.commercialStatus,
        recommendedPlan: customer.recommendedPlan,
        curation: { ...customer.curation },
        campaign: { ...customer.campaign },
      },
    ])
  ) as Record<string, CustomerDraft>;
}

export function DgnGrowthWorkspace({
  view,
  customerId,
}: {
  view: GrowthView;
  customerId?: string;
}) {
  const [drafts, setDrafts] = useState(createDrafts);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? dgnCustomers[0]?.id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [planFilter, setPlanFilter] = useState("Todos");
  const [scoreFilter, setScoreFilter] = useState("Todos");
  const [notice, setNotice] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  const customers = useMemo(
    () =>
      dgnCustomers.map((customer) => ({
        ...customer,
        commercialStatus: drafts[customer.id]?.commercialStatus ?? customer.commercialStatus,
        recommendedPlan: drafts[customer.id]?.recommendedPlan ?? customer.recommendedPlan,
        curation: drafts[customer.id]?.curation ?? customer.curation,
        campaign: drafts[customer.id]?.campaign ?? customer.campaign,
      })),
    [drafts]
  );

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];

  const visibleCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            customer.name,
            customer.vehicle,
            customer.companyLink,
            customer.origin,
            customer.phone,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
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
      .sort((a, b) => b.scoreDgn - a.scoreDgn);
  }, [customers, planFilter, query, scoreFilter, statusFilter]);

  const metrics = useMemo(() => {
    const awaiting = customers.filter(
      (customer) => customer.commercialStatus === "Aguardando Curadoria DGN"
    );
    const highScore = customers.filter((customer) => customer.scoreDgn >= 80);
    const founders = customers.filter((customer) => customer.campaign.founderSelected);
    const totalHistorical = customers.reduce((sum, customer) => sum + customer.historicalValue, 0);
    const potentialRevenue = customers.reduce(
      (sum, customer) => sum + getPotentialRevenue(customer),
      0
    );
    const byPlan = recommendedPlans.map((plan) => ({
      plan,
      total: customers.filter((customer) => customer.recommendedPlan === plan).length,
    }));

    return {
      total: customers.length,
      awaiting: awaiting.length,
      highScore: highScore.length,
      founders: founders.length,
      totalHistorical,
      potentialRevenue,
      byPlan,
    };
  }, [customers]);

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
    const converted = founders.filter(
      (customer) => customer.campaign.campaignStatus === "Assinante ativo"
    );

    return {
      available: 30 - founders.length,
      created: withPage.length,
      sent: sent.length,
      viewed: viewed.length,
      conversations: conversations.length,
      payments: payments.length,
      converted: converted.length,
      revenue: converted.reduce((sum, customer) => sum + getPotentialRevenue(customer), 0),
      founders,
    };
  }, [customers]);

  const patchCustomer = (id: string, patch: Partial<CustomerDraft>) => {
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

  const copyText = async (key: string, value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1600);
  };

  const openWhatsapp = (customer: DgnCustomer) => {
    const message = buildFounderWhatsappMessage(customer, getOrigin());
    const url = buildWhatsappUrl(customer, message);

    if (!url) {
      setNotice("Telefone nao cadastrado.");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <GrowthHeader current={view} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <InternalNotice notice={notice} />

        {view === "intelligence" ? (
          <IntelligenceView
            metrics={metrics}
            customers={visibleCustomers}
            query={query}
            statusFilter={statusFilter}
            planFilter={planFilter}
            scoreFilter={scoreFilter}
            onQuery={setQuery}
            onStatusFilter={setStatusFilter}
            onPlanFilter={setPlanFilter}
            onScoreFilter={setScoreFilter}
            onOpenProfile={setSelectedCustomerId}
          />
        ) : null}

        {view === "curadoria" ? (
          <CurationView
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomerId}
            onPatch={patchCustomer}
          />
        ) : null}

        {view === "founders" ? (
          <FoundersView
            customers={customers}
            campaignMetrics={campaignMetrics}
            onPatch={patchCustomer}
            onOpenProfile={setSelectedCustomerId}
            onOpenWhatsapp={openWhatsapp}
            onCopy={(customer) =>
              copyText(`message-${customer.id}`, buildFounderWhatsappMessage(customer, getOrigin()))
            }
            copiedKey={copiedKey}
          />
        ) : null}

        {view === "profile" && selectedCustomer ? (
          <CustomerProfileInline
            customer={selectedCustomer}
            onPatch={patchCustomer}
            onOpenWhatsapp={openWhatsapp}
            onCopy={() =>
              copyText(
                `message-${selectedCustomer.id}`,
                buildFounderWhatsappMessage(selectedCustomer, getOrigin())
              )
            }
            copied={copiedKey === `message-${selectedCustomer.id}`}
          />
        ) : null}
      </main>

      {view !== "profile" && selectedCustomerId ? (
        <CustomerDrawer
          customer={selectedCustomer}
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
        />
      ) : null}
    </div>
  );
}

function GrowthHeader({ current }: { current: GrowthView }) {
  const links = [
    { href: "/admin/growth/intelligence", label: "Intelligence", view: "intelligence" },
    { href: "/admin/growth/curadoria", label: "Curadoria", view: "curadoria" },
    { href: "/admin/growth/founders-2026", label: "Founders 2026", view: "founders" },
  ];

  return (
    <header className="border-b border-white/[0.08] bg-[#0B0B0B]/95 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            DGN Growth
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
            MVP comercial Founders 2026
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            Intelligence, Curadoria DGN e Campaign Center em estrutura local preparada para
            persistencia futura.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                current === link.view
                  ? "border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#E7C96A]"
                  : "border-white/[0.08] bg-white/[0.035] text-[#D1D5DB] hover:border-[#C9A84C]/30"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function InternalNotice({ notice }: { notice: string }) {
  return (
    <>
      <section className="mb-5 rounded-lg border border-[#C9A84C]/18 bg-[#111111] p-4">
        <div className="flex gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#C9A84C]" />
          <div>
            <p className="text-sm font-semibold text-white">Rota interna</p>
            <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
              Proteger com autenticacao/admin antes de operar dados reais. MVP sem WhatsApp
              Business API, disparo em massa, ERP, modulo financeiro ou banco definitivo.
            </p>
          </div>
        </div>
      </section>
      {notice ? (
        <div className="fixed right-4 top-4 z-[70] rounded-lg border border-[#C9A84C]/30 bg-[#111111] px-4 py-3 text-sm font-semibold text-[#E7C96A] shadow-2xl">
          {notice}
        </div>
      ) : null}
    </>
  );
}

function IntelligenceView({
  metrics,
  customers,
  query,
  statusFilter,
  planFilter,
  scoreFilter,
  onQuery,
  onStatusFilter,
  onPlanFilter,
  onScoreFilter,
  onOpenProfile,
}: {
  metrics: {
    total: number;
    awaiting: number;
    highScore: number;
    founders: number;
    totalHistorical: number;
    potentialRevenue: number;
    byPlan: { plan: RecommendedPlan; total: number }[];
  };
  customers: DgnCustomer[];
  query: string;
  statusFilter: string;
  planFilter: string;
  scoreFilter: string;
  onQuery: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onPlanFilter: (value: string) => void;
  onScoreFilter: (value: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="Clientes importados" value={String(metrics.total)} icon={UserRound} />
        <MetricCard label="Aguardando curadoria" value={String(metrics.awaiting)} icon={Filter} />
        <MetricCard label="Alto score" value={String(metrics.highScore)} icon={BadgeCheck} />
        <MetricCard label="Selecionados Founder" value={String(metrics.founders)} icon={Crown} />
        <MetricCard
          label="Valor historico"
          value={formatCurrency(metrics.totalHistorical)}
          icon={Banknote}
          wide
        />
        <MetricCard
          label="Potencial receita"
          value={formatCurrency(metrics.potentialRevenue)}
          icon={ArrowRight}
          wide
        />
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.byPlan.map((item) => (
          <div key={item.plan} className="rounded-lg border border-white/[0.08] bg-[#101010] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
              Plano recomendado
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{item.plan}</p>
            <p className="mt-1 text-sm text-[#A7A7A7]">{item.total} clientes</p>
          </div>
        ))}
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

      <CustomersTable customers={customers} onOpenProfile={onOpenProfile} />
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
    <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr]">
        <label className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D7D7D]"
          />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Buscar por nome, veiculo, empresa ou telefone"
            className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#666] focus:border-[#C9A84C]/35"
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

function CustomersTable({
  customers,
  onOpenProfile,
}: {
  customers: DgnCustomer[];
  onOpenProfile: (id: string) => void;
}) {
  return (
    <section className="mt-5 rounded-lg border border-white/[0.08] bg-[#101010]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            DGN Intelligence
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Base importada e priorizada</h2>
        </div>
        <SlidersHorizontal size={18} className="text-[#C9A84C]" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.07] text-left">
              {[
                "Nome",
                "Telefone",
                "Veiculo",
                "Placa",
                "Empresa/vinculo",
                "Origem",
                "Atend.",
                "Valor historico",
                "Cliente desde",
                "Ultimo",
                "Score",
                "Plano",
                "Status",
                "Acao",
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
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-white/[0.05] hover:bg-white/[0.025]">
                <td className="px-4 py-4 text-sm font-semibold text-white">{customer.name}</td>
                <td className="px-4 py-4 text-sm text-[#D1D5DB]">
                  {customer.phone || "Nao cadastrado"}
                </td>
                <td className="px-4 py-4 text-sm text-[#E5E7EB]">{customer.vehicle}</td>
                <td className="px-4 py-4 text-sm text-[#A7A7A7]">{maskPlate(customer.plate)}</td>
                <td className="px-4 py-4 text-sm text-[#D1D5DB]">{customer.companyLink}</td>
                <td className="px-4 py-4 text-sm text-[#A7A7A7]">{customer.origin}</td>
                <td className="px-4 py-4 text-sm text-white">{customer.washCount}</td>
                <td className="px-4 py-4 text-sm font-semibold text-white">
                  {formatCurrency(customer.historicalValue)}
                </td>
                <td className="px-4 py-4 text-sm text-[#A7A7A7]">{customer.customerSince}</td>
                <td className="px-4 py-4 text-sm text-[#A7A7A7]">{customer.lastAttendance}</td>
                <td className="px-4 py-4">
                  <ScorePill score={customer.scoreDgn} />
                </td>
                <td className="px-4 py-4 text-sm text-[#D1D5DB]">{customer.recommendedPlan}</td>
                <td className="px-4 py-4">
                  <StatusBadge label={customer.commercialStatus} />
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onOpenProfile(customer.id)}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#C9A84C]/24 bg-[#C9A84C]/10 px-3 text-sm font-semibold text-[#E7C96A] transition hover:border-[#C9A84C]/45"
                  >
                    <PanelRight size={15} />
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CurationView({
  customers,
  selectedCustomer,
  onSelect,
  onPatch,
}: {
  customers: DgnCustomer[];
  selectedCustomer: DgnCustomer;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
}) {
  const sortedCustomers = [...customers].sort((a, b) => b.scoreDgn - a.scoreDgn);

  return (
    <section className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <div className="rounded-lg border border-white/[0.08] bg-[#101010]">
        <div className="border-b border-white/[0.08] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Curadoria DGN
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Ordenado por Score DGN</h2>
        </div>
        <div className="max-h-[calc(100vh-15rem)] overflow-y-auto p-2">
          {sortedCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer.id)}
              className={`mb-2 w-full rounded-lg border p-3 text-left transition ${
                selectedCustomer.id === customer.id
                  ? "border-[#C9A84C]/35 bg-[#C9A84C]/10"
                  : "border-white/[0.06] bg-white/[0.025] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{customer.name}</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{customer.vehicle}</p>
                </div>
                <ScorePill score={customer.scoreDgn} />
              </div>
              <p className="mt-2 text-xs text-[#7D7D7D]">{customer.commercialStatus}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-[#101010] p-5">
        <CustomerSnapshot customer={selectedCustomer} />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <SelectBlock
            label="Perfil"
            value={selectedCustomer.curation.profile}
            options={curationProfiles}
            onChange={(value) =>
              onPatch(selectedCustomer.id, { curation: { profile: value } as CustomerDraft["curation"] })
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
          <SelectBlock
            label="Decisao Founder"
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
              Numero Founder
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
              className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-white outline-none placeholder:text-[#666] focus:border-[#C9A84C]/35"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
              Observacoes internas
            </span>
            <textarea
              value={selectedCustomer.curation.internalNotes}
              onChange={(event) =>
                onPatch(selectedCustomer.id, {
                  curation: { internalNotes: event.target.value } as CustomerDraft["curation"],
                })
              }
              rows={4}
              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white outline-none placeholder:text-[#666] focus:border-[#C9A84C]/35"
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function FoundersView({
  customers,
  campaignMetrics,
  onPatch,
  onOpenProfile,
  onOpenWhatsapp,
  onCopy,
  copiedKey,
}: {
  customers: DgnCustomer[];
  campaignMetrics: {
    available: number;
    created: number;
    sent: number;
    viewed: number;
    conversations: number;
    payments: number;
    converted: number;
    revenue: number;
    founders: DgnCustomer[];
  };
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
  onOpenProfile: (id: string) => void;
  onOpenWhatsapp: (customer: DgnCustomer) => void;
  onCopy: (customer: DgnCustomer) => void;
  copiedKey: string;
}) {
  const founderRows = [
    ...campaignMetrics.founders,
    ...Array.from({ length: Math.max(0, 30 - campaignMetrics.founders.length) }, (_, index) => {
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
          lastAction: "Slot disponivel",
          nextAction: "Selecionar cliente na Curadoria DGN",
          notes: "Slot reservado para completar os 30 Founders.",
          founderSelected: false,
        },
        isSlot: true,
      };
    }),
  ];

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Convites disponiveis" value={String(campaignMetrics.available)} icon={Crown} />
        <MetricCard label="Convites criados" value={String(campaignMetrics.created)} icon={Check} />
        <MetricCard label="Enviados" value={String(campaignMetrics.sent)} icon={Send} />
        <MetricCard label="Visualizados" value={String(campaignMetrics.viewed)} icon={Eye} />
        <MetricCard label="Conversando" value={String(campaignMetrics.conversations)} icon={MessageCircle} />
        <MetricCard label="Pagamentos enviados" value={String(campaignMetrics.payments)} icon={Banknote} />
        <MetricCard label="Convertidos" value={`${campaignMetrics.converted} / 30`} icon={BadgeCheck} />
        <MetricCard label="Receita gerada" value={formatCurrency(campaignMetrics.revenue)} icon={Banknote} wide />
      </section>

      <section className="mt-5 rounded-lg border border-white/[0.08] bg-[#101010]">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Membros Fundadores DGN Club
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Meta: 30 assinaturas semestrais
            </h2>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06] sm:w-80">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#C9A84C,#F0D060)]"
              style={{ width: `${(campaignMetrics.converted / 30) * 100}%` }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07] text-left">
                {[
                  "Founder",
                  "Nome",
                  "Telefone",
                  "Veiculo",
                  "Placa",
                  "Score",
                  "Plano",
                  "Condicao",
                  "Status",
                  "Pagina",
                  "Ultima/proxima acao",
                  "Acoes",
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
              {founderRows.map((row) => {
                const customer = row as DgnCustomer & { isSlot?: boolean };
                const isSlot = customer.isSlot;
                const status = customer.campaign.campaignStatus || "Selecionado";

                return (
                  <tr
                    key={customer.id}
                    className="border-b border-white/[0.05] hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-[#C9A84C]/18 bg-[#C9A84C]/8 px-2.5 py-1 text-xs font-semibold text-[#E7C96A]">
                        <Crown size={14} />
                        {customer.campaign.founderNumber || "000"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        disabled={isSlot}
                        onClick={() => onOpenProfile(customer.id)}
                        className="text-left disabled:cursor-not-allowed"
                      >
                        <span className="block text-sm font-semibold text-white">
                          {customer.name}
                        </span>
                        <span className="mt-1 block text-xs text-[#747474]">
                          {isSlot ? "Slot interno" : customer.companyLink}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#D1D5DB]">
                      {customer.phone || "Nao cadastrado"}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#E5E7EB]">{customer.vehicle}</td>
                    <td className="px-4 py-4 text-sm text-[#A7A7A7]">{maskPlate(customer.plate)}</td>
                    <td className="px-4 py-4">
                      <ScorePill score={customer.scoreDgn} />
                    </td>
                    <td className="px-4 py-4 text-sm text-[#D1D5DB]">
                      {customer.recommendedPlan}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#D1D5DB]">
                      {customer.campaign.founderCondition || "A definir"}
                    </td>
                    <td className="px-4 py-4">
                      {isSlot ? (
                        <StatusBadge label="Slot disponivel" />
                      ) : (
                        <SelectField
                          value={status}
                          onChange={(value) =>
                            onPatch(customer.id, {
                              commercialStatus: mapCampaignToCommercial(value as FoundersPipelineStatus),
                              campaign: {
                                campaignStatus: value as FoundersPipelineStatus,
                                lastAction: value,
                                nextAction: nextActionForCampaign(value as FoundersPipelineStatus),
                              } as CustomerDraft["campaign"],
                            })
                          }
                        >
                          {foundersPipelineStatuses.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </SelectField>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {customer.campaign.personalizedPagePath ? (
                        <Link
                          href={customer.campaign.personalizedPagePath}
                          target="_blank"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#E7C96A]"
                          title="Ver pagina personalizada"
                          aria-label="Ver pagina personalizada"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      ) : (
                        <span className="text-xs text-[#747474]">Pendente</span>
                      )}
                    </td>
                    <td className="max-w-[230px] px-4 py-4">
                      <p className="text-xs font-semibold text-white">{customer.campaign.lastAction}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#8A8A8A]">
                        {customer.campaign.nextAction}
                      </p>
                    </td>
                    <td className="px-4 py-4">
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
                        />
                        <IconButton
                          label="Copiar mensagem"
                          icon={copiedKey === `message-${customer.id}` ? Check : Copy}
                          disabled={isSlot}
                          onClick={() => onCopy(customer)}
                        />
                        {customer.campaign.paymentLink ? (
                          <Link
                            href={customer.campaign.paymentLink}
                            target="_blank"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-[#BDBDBD]"
                            title="Link de pagamento"
                            aria-label="Link de pagamento"
                          >
                            <Banknote size={14} />
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

function CustomerDrawer({
  customer,
  copied,
  onClose,
  onPatch,
  onOpenWhatsapp,
  onCopy,
}: {
  customer: DgnCustomer;
  copied: boolean;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
  onOpenWhatsapp: (customer: DgnCustomer) => void;
  onCopy: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0D0D0D] shadow-2xl sm:w-[34rem]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#C9A84C]/25 bg-[#C9A84C]/10 text-[#C9A84C]">
            <PanelRight size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
              Perfil individual
            </p>
            <h2 className="text-base font-semibold text-white">{customer.name}</h2>
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
        <CustomerProfileInline
          customer={customer}
          copied={copied}
          onPatch={onPatch}
          onOpenWhatsapp={onOpenWhatsapp}
          onCopy={onCopy}
        />
      </div>
    </aside>
  );
}

function CustomerProfileInline({
  customer,
  copied,
  onPatch,
  onOpenWhatsapp,
  onCopy,
}: {
  customer: DgnCustomer;
  copied: boolean;
  onPatch: (id: string, patch: Partial<CustomerDraft>) => void;
  onOpenWhatsapp: (customer: DgnCustomer) => void;
  onCopy: () => void;
}) {
  const timeline = getCustomerTimeline(customer);

  return (
    <div>
      <CustomerSnapshot customer={customer} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ProfileFact label="Ticket medio" value={formatCurrency(getTicketAverage(customer))} />
        <ProfileFact
          label="Intervalo medio"
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
          value={customer.campaign.founderSelected ? `Sim - ${customer.campaign.founderNumber}` : "Nao"}
        />
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
          Links e WhatsApp manual assistido
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {customer.campaign.personalizedPagePath ? (
            <Link
              href={customer.campaign.personalizedPagePath}
              target="_blank"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#C9A84C]/22 bg-[#C9A84C]/10 px-3 text-sm font-semibold text-[#E7C96A]"
            >
              <ExternalLink size={15} />
              Pagina personalizada
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 text-sm font-semibold text-[#606060]"
            >
              <ExternalLink size={15} />
              Pagina pendente
            </button>
          )}
          <button
            onClick={() => onOpenWhatsapp(customer)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm font-semibold text-white"
          >
            <MessageCircle size={15} />
            Abrir WhatsApp
          </button>
          <button
            onClick={onCopy}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm font-semibold text-white sm:col-span-2"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Mensagem copiada" : "Copiar mensagem"}
          </button>
        </div>
        {!customer.phone ? (
          <p className="mt-3 text-xs text-[#8A8A8A]">Telefone nao cadastrado.</p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Ultimo contato
          </span>
          <input
            value={customer.campaign.lastContact}
            onChange={(event) =>
              onPatch(customer.id, {
                campaign: { lastContact: event.target.value } as CustomerDraft["campaign"],
              })
            }
            placeholder="Ex.: 03/07/2026"
            className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/35"
          />
        </label>
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Status da conversa
          </span>
          <input
            value={customer.campaign.conversationStatus}
            onChange={(event) =>
              onPatch(customer.id, {
                campaign: { conversationStatus: event.target.value } as CustomerDraft["campaign"],
              })
            }
            className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/35"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Proxima acao
          </span>
          <input
            value={customer.campaign.nextAction}
            onChange={(event) =>
              onPatch(customer.id, {
                campaign: { nextAction: event.target.value } as CustomerDraft["campaign"],
              })
            }
            className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/35"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Observacoes internas
          </span>
          <textarea
            rows={3}
            value={customer.campaign.notes}
            onChange={(event) =>
              onPatch(customer.id, {
                campaign: { notes: event.target.value } as CustomerDraft["campaign"],
              })
            }
            className="mt-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm text-white outline-none focus:border-[#C9A84C]/35"
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#101010] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
          Timeline comercial
        </p>
        <div className="mt-4 space-y-3">
          {timeline.map((item) => (
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
  );
}

function CustomerSnapshot({ customer }: { customer: DgnCustomer }) {
  return (
    <div className="rounded-lg border border-[#C9A84C]/18 bg-[#121212] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-2xl font-semibold text-white">{customer.name}</p>
          <p className="mt-2 text-sm text-[#A7A7A7]">
            {customer.vehicle} | Placa {maskPlate(customer.plate)}
          </p>
          <p className="mt-1 text-sm text-[#A7A7A7]">
            {customer.companyLink} | {customer.origin}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScorePill score={customer.scoreDgn} />
          <StatusBadge label={customer.commercialStatus} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileFact label="Atendimentos" value={String(customer.washCount)} compact />
        <ProfileFact label="Recorrencia" value={customer.recurrence} compact />
        <ProfileFact label="Valor investido" value={formatCurrency(customer.historicalValue)} compact />
        <ProfileFact label="Ultimo atendimento" value={customer.lastAttendance} compact />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ProfileFact label="Plano sugerido" value={customer.recommendedPlan} compact />
        <ProfileFact label="Desde" value={customer.customerSince} compact />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  wide = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-white/[0.08] bg-[#111111] p-4 ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
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

function ScorePill({ score }: { score: number }) {
  return (
    <span className="inline-flex min-h-7 min-w-12 items-center justify-center rounded-full border border-[#C9A84C]/24 bg-[#C9A84C]/10 px-2.5 text-xs font-semibold text-[#E7C96A]">
      {score || "-"}
    </span>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${
        statusTone[label] ?? "border-white/[0.08] bg-white/[0.035] text-[#D1D5DB]"
      }`}
    >
      {label}
    </span>
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
      className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#C9A84C]/35"
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
    "Mensagem enviada": "Acompanhar visualizacao e resposta",
    Visualizou: "Chamar para confirmar interesse",
    Conversando: "Enviar link de pagamento",
    "Pagamento enviado": "Acompanhar confirmacao",
    "Assinante ativo": "Preparar kit Founder",
    "Aguardando Kit Founder": "Entregar kit e registrar boas-vindas",
    Perdido: "Registrar motivo e encerrar campanha",
  };

  return map[status];
}
