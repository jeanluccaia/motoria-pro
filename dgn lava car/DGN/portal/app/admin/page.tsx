"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Car,
  Package,
  Droplets,
  Star,
  Sparkles,
  RefreshCw,
  ExternalLink,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Menu,
  X,
  Settings,
  Copy,
  Crown,
  Link2,
  Send,
  Eye,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { founders } from "@/lib/founders-data";

/* ─── data ─── */

const kpis = [
  {
    label: "Assinantes Ativos",
    value: "248",
    icon: Users,
    color: "#818CF8",
    bg: "rgba(129,140,248,0.1)",
    change: "+12 este mês",
    up: true,
  },
  {
    label: "Veículos Cadastrados",
    value: "312",
    icon: Car,
    color: "#34D399",
    bg: "rgba(52,211,153,0.1)",
    change: "+18 este mês",
    up: true,
  },
  {
    label: "Planos Disponíveis",
    value: "3",
    icon: Package,
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.1)",
    change: "Básico, Pro, Elite",
    up: null,
  },
  {
    label: "Lavagens Disponíveis",
    value: "892",
    icon: Droplets,
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.1)",
    change: "Saldo agregado ativo",
    up: null,
  },
  {
    label: "Renovações este mês",
    value: "18",
    icon: RefreshCw,
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.1)",
    change: "+3 vs. mês ant.",
    up: true,
  },
  {
    label: "Benefícios Ativos",
    value: "6",
    icon: Star,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    change: "Plano Elite",
    up: null,
  },
];

const recentActivity = [
  {
    client: "Maria Santos",
    action: "Nova assinatura Elite",
    detail: "BMW X5 · BCD-5678",
    time: "Hoje, 10:30",
    status: "Ativo",
    ok: true,
  },
  {
    client: "João Ferreira",
    action: "Renovação Plano Pro",
    detail: "Honda Civic · EFG-9012",
    time: "Hoje, 09:15",
    status: "Renovado",
    ok: true,
  },
  {
    client: "Ana Rodrigues",
    action: "Upgrade para Elite",
    detail: "BMW X5 · ABC-1234",
    time: "Hoje, 08:00",
    status: "Ativo",
    ok: true,
  },
  {
    client: "Pedro Costa",
    action: "Nova assinatura Básico",
    detail: "VW Golf · HIJ-3456",
    time: "Ontem, 17:45",
    status: "Ativo",
    ok: true,
  },
  {
    client: "Carla Lima",
    action: "Assinatura expirada",
    detail: "Fiat Argo · KLM-7890",
    time: "Ontem, 16:30",
    status: "Expirado",
    ok: false,
  },
];

const sidebarItems: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "founders", label: "Founders", icon: Crown },
  { key: "assinantes", label: "Assinantes", icon: Users },
  { key: "planos", label: "Planos", icon: Package },
  { key: "saldo", label: "Saldo de Lavagens", icon: Droplets },
  { key: "veiculos", label: "Veículos", icon: Car },
  { key: "beneficios", label: "Benefícios", icon: Star },
  { key: "servicos", label: "Serv. Recomendados", icon: Sparkles },
  { key: "renovacao", label: "Renovação", icon: RefreshCw },
];

const UTM_PARAMS = "utm_source=portal_assinante&utm_medium=app&utm_campaign=clube_dgn";

/* ─── sub-components (module level) ─── */

function LinksConfig() {
  const [agendaUrl, setAgendaUrl] = useState("");
  const [vitrineUrl, setVitrineUrl] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase mb-4">
          URLs da plataforma 4U
        </h3>
        <div className="space-y-4">
          {[
            {
              label: "URL — Agenda (Agendar Lavagem)",
              placeholder: "https://app.4u.com.br/dgn/agenda",
              value: agendaUrl,
              onChange: setAgendaUrl,
            },
            {
              label: "URL — Vitrine (Serviços Extras)",
              placeholder: "https://app.4u.com.br/dgn/vitrine",
              value: vitrineUrl,
              onChange: setVitrineUrl,
            },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs font-medium text-[#9CA3AF] tracking-wider uppercase mb-2 block">
                {field.label}
              </label>
              <input
                type="url"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* UTM display */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#111111", border: "1px solid #2A2A2A" }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider uppercase">
            Parâmetros UTM (adicionados automaticamente)
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(`?${UTM_PARAMS}`)}
            className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#F0D060] transition-colors"
          >
            <Copy size={11} />
            Copiar
          </button>
        </div>
        <p className="text-xs text-[#4B5563] font-mono break-all leading-relaxed">
          ?{UTM_PARAMS}
        </p>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-3 rounded-xl font-semibold text-sm text-[#0A0A0A] transition-all active:scale-[0.98]"
        style={{
          background: saved
            ? "linear-gradient(135deg, #34D399, #10B981)"
            : "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
          boxShadow: "0 4px 20px rgba(201,168,76,0.2)",
        }}
      >
        {saved ? "Salvo!" : "Salvar configurações"}
      </button>
    </div>
  );
}

function FoundersTab() {
  const [statuses, setStatuses] = useState<
    Record<string, { inviteSent: boolean; pageViewed: boolean; signatureConfirmed: boolean }>
  >(
    Object.fromEntries(
      founders.map((f) => [
        f.id,
        {
          inviteSent: f.adminStatus.inviteSent,
          pageViewed: f.adminStatus.pageViewed,
          signatureConfirmed: f.adminStatus.signatureConfirmed,
        },
      ])
    )
  );

  const toggle = (id: string, field: "inviteSent" | "pageViewed" | "signatureConfirmed") => {
    setStatuses((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: !prev[id][field] },
    }));
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/founders/${slug}`;
    navigator.clipboard?.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase">
          Piloto Founders — {founders.length} convidado{founders.length !== 1 ? "s" : ""}
        </h3>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}
        >
          Beta privado
        </span>
      </div>

      {founders.map((founder) => {
        const st = statuses[founder.id];
        return (
          <motion.div
            key={founder.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1A1408 0%, #111111 100%)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            {/* header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#2A2A2A] flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C, #F0D060)",
                  }}
                >
                  <Crown size={18} className="text-[#0A0A0A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm">{founder.fullName}</p>
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}
                    >
                      Founder {founder.number}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{founder.vehicle.model}</p>
                </div>
              </div>
              <button
                onClick={() => copyLink(founder.slug)}
                className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#F0D060] transition-colors px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: "rgba(201,168,76,0.08)" }}
              >
                <Link2 size={13} />
                Copiar link
              </button>
            </div>

            {/* status grid */}
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(
                [
                  { key: "pageCreated", label: "Página", value: true, static: true },
                  {
                    key: "inviteSent",
                    label: "Convite enviado",
                    value: st.inviteSent,
                    icon: Send,
                    field: "inviteSent" as const,
                  },
                  {
                    key: "pageViewed",
                    label: "Visualizado",
                    value: st.pageViewed,
                    icon: Eye,
                    field: "pageViewed" as const,
                  },
                  {
                    key: "signatureConfirmed",
                    label: "Assinatura",
                    value: st.signatureConfirmed,
                    icon: BadgeCheck,
                    field: "signatureConfirmed" as const,
                  },
                  {
                    key: "paymentStatus",
                    label: "Pagamento",
                    textValue: founder.adminStatus.paymentStatus,
                    static: true,
                  },
                  {
                    key: "kitStatus",
                    label: "Kit",
                    textValue: founder.adminStatus.kitStatus,
                    static: true,
                  },
                ] as Array<{
                  key: string;
                  label: string;
                  value?: boolean;
                  textValue?: string;
                  static?: boolean;
                  icon?: LucideIcon;
                  field?: "inviteSent" | "pageViewed" | "signatureConfirmed";
                }>
              ).map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl p-3 space-y-1"
                  style={{ background: "#0F0F0F", border: "1px solid #2A2A2A" }}
                >
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                    {item.label}
                  </p>
                  {item.textValue !== undefined ? (
                    <p
                      className="text-xs font-semibold"
                      style={{ color: item.textValue === "Pendente" ? "#9CA3AF" : "#34D399" }}
                    >
                      {item.textValue}
                    </p>
                  ) : item.static ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(52,211,153,0.1)", color: "#34D399" }}
                    >
                      <CheckCircle2 size={10} /> Criada
                    </span>
                  ) : (
                    <button
                      onClick={() => item.field && toggle(founder.id, item.field)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer"
                      style={
                        item.value
                          ? { background: "rgba(52,211,153,0.1)", color: "#34D399" }
                          : { background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }
                      }
                    >
                      {item.icon && <item.icon size={10} />}
                      {item.value ? "Sim" : "Não"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* plan + link */}
            <div
              className="px-5 py-3 border-t border-[#2A2A2A] flex items-center justify-between"
              style={{ background: "rgba(201,168,76,0.03)" }}
            >
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                  Plano recomendado
                </p>
                <p className="text-xs text-white font-semibold mt-0.5">
                  {founder.recommendedPlan.name}
                </p>
              </div>
              <a
                href={`/founders/${founder.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] hover:text-[#F0D060] transition-colors"
              >
                Ver página
                <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function PlaceholderTab({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(201,168,76,0.08)" }}
      >
        <Icon size={24} className="text-[#C9A84C]" />
      </div>
      <p className="text-white font-semibold mb-1">{label}</p>
      <p className="text-sm text-[#9CA3AF]">Módulo disponível na próxima versão</p>
    </div>
  );
}

interface SidebarNavProps {
  activeTab: string;
  onSelect: (key: string) => void;
}

function SidebarNav({ activeTab, onSelect }: SidebarNavProps) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
              isActive
                ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon size={17} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── main page ─── */

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelect = (key: string) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const activeLabel =
    sidebarItems.find((s) => s.key === activeTab)?.label ??
    (activeTab === "links" ? "Links da 4U" : activeTab);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 min-h-screen border-r border-[#2A2A2A] sticky top-0"
        style={{ background: "#111111" }}
      >
        <div className="px-6 py-6 border-b border-[#2A2A2A]">
          <p className="text-[10px] text-[#9CA3AF] tracking-widest uppercase font-medium mb-0.5">
            Portal
          </p>
          <h1 className="text-xl font-bold">
            <span className="gold-gradient-text">DGN</span>{" "}
            <span className="text-white">Admin</span>
          </h1>
        </div>

        <SidebarNav activeTab={activeTab} onSelect={setActiveTab} />

        <div className="px-3 py-4 border-t border-[#2A2A2A] space-y-1">
          <button
            onClick={() => setActiveTab("links")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              activeTab === "links"
                ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
            }`}
          >
            <ExternalLink size={17} />
            <span className="text-sm font-medium">Links da 4U</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all duration-200">
            <Settings size={17} />
            <span className="text-sm font-medium">Configurações</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative w-64 h-full border-r border-[#2A2A2A] flex flex-col"
            style={{ background: "#111111" }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-[#2A2A2A]">
              <h1 className="text-lg font-bold">
                <span className="gold-gradient-text">DGN</span>{" "}
                <span className="text-white">Admin</span>
              </h1>
              <button onClick={() => setSidebarOpen(false)} className="text-[#9CA3AF]">
                <X size={20} />
              </button>
            </div>

            <SidebarNav activeTab={activeTab} onSelect={handleSelect} />

            <div className="px-3 py-4 border-t border-[#2A2A2A] space-y-1">
              <button
                onClick={() => handleSelect("links")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  activeTab === "links"
                    ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                    : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                }`}
              >
                <ExternalLink size={17} />
                <span className="text-sm font-medium">Links da 4U</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 border-b border-[#2A2A2A] px-5 py-4 flex items-center justify-between"
          style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider font-medium hidden sm:block">
                Portal Admin · DGN Club
              </p>
              <h2 className="text-lg font-bold text-white">{activeLabel}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-[#9CA3AF] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg">
              25/06/2026
            </span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-[#0A0A0A]"
              style={{ background: "linear-gradient(135deg, #C9A84C, #F0D060)" }}
            >
              AD
            </div>
          </div>
        </header>

        <div className="p-5 space-y-6 max-w-6xl">
          {/* Dashboard tab */}
          {activeTab === "dashboard" && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase mb-4">
                  Visão Geral
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {kpis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                      <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.35 }}
                        className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
                        style={{
                          background: "linear-gradient(135deg, #111111 0%, #1A1A1A 100%)",
                          border: `1px solid ${kpi.color}20`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: kpi.bg }}
                          >
                            <Icon size={18} style={{ color: kpi.color }} />
                          </div>
                          {kpi.up !== null && (
                            <TrendingUp
                              size={14}
                              className={kpi.up ? "text-[#34D399]" : "text-red-400 rotate-180"}
                            />
                          )}
                        </div>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5 leading-tight">{kpi.label}</p>
                        <p
                          className="text-[11px] mt-1.5 font-medium"
                          style={{
                            color:
                              kpi.up === true
                                ? "#34D399"
                                : kpi.up === false
                                ? "#F97316"
                                : "#9CA3AF",
                          }}
                        >
                          {kpi.change}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase">
                    Atividade Recente
                  </h3>
                  <button className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#F0D060] transition-colors font-medium">
                    Ver tudo <ChevronRight size={12} />
                  </button>
                </div>

                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #2A2A2A" }}
                >
                  {recentActivity.map((act, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                        i !== 0 ? "border-t border-[#1A1A1A]" : ""
                      }`}
                      style={{ background: "#111111" }}
                    >
                      <div className="flex-shrink-0">
                        {act.ok === true ? (
                          <CheckCircle2 size={18} className="text-[#34D399]" />
                        ) : act.ok === false ? (
                          <XCircle size={18} className="text-red-400" />
                        ) : (
                          <Clock size={18} className="text-[#C9A84C]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {act.client}
                            </p>
                            <p className="text-xs text-[#9CA3AF] truncate">{act.action}</p>
                            <p className="text-[11px] text-[#4B5563] mt-0.5 truncate">
                              {act.detail}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  act.ok === true
                                    ? "rgba(52,211,153,0.1)"
                                    : "rgba(248,113,113,0.1)",
                                color: act.ok === true ? "#34D399" : "#F87171",
                              }}
                            >
                              {act.status}
                            </span>
                            <p className="text-[11px] text-[#4B5563] mt-1">{act.time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* Links tab */}
          {activeTab === "links" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <LinksConfig />
            </motion.div>
          )}

          {/* Founders tab */}
          {activeTab === "founders" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <FoundersTab />
            </motion.div>
          )}

          {/* Placeholder tabs */}
          {activeTab === "assinantes" && <PlaceholderTab label="Gestão de Assinantes" icon={Users} />}
          {activeTab === "planos" && <PlaceholderTab label="Gestão de Planos" icon={Package} />}
          {activeTab === "saldo" && <PlaceholderTab label="Saldo de Lavagens" icon={Droplets} />}
          {activeTab === "veiculos" && <PlaceholderTab label="Veículos Cadastrados" icon={Car} />}
          {activeTab === "beneficios" && <PlaceholderTab label="Gestão de Benefícios" icon={Star} />}
          {activeTab === "servicos" && <PlaceholderTab label="Serviços Recomendados" icon={Sparkles} />}
          {activeTab === "renovacao" && <PlaceholderTab label="Renovações" icon={RefreshCw} />}
        </div>
      </main>
    </div>
  );
}
