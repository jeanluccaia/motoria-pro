"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Car,
  Package,
  Droplets,
  DollarSign,
  AlertCircle,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Settings,
} from "lucide-react";

const kpis = [
  {
    label: "Clientes Ativos",
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
    label: "Lavagens Realizadas",
    value: "1.847",
    icon: Droplets,
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.1)",
    change: "+127 este mês",
    up: true,
  },
  {
    label: "Receita Mensal",
    value: "R$ 48.920",
    icon: DollarSign,
    color: "#34D399",
    bg: "rgba(52,211,153,0.1)",
    change: "+8.4% vs. mês ant.",
    up: true,
  },
  {
    label: "Solicitações Pendentes",
    value: "12",
    icon: AlertCircle,
    color: "#F97316",
    bg: "rgba(249,115,22,0.1)",
    change: "4 urgentes",
    up: false,
  },
];

const recentActivity = [
  {
    client: "Maria Santos",
    service: "Lavagem Premium Completa",
    vehicle: "Toyota Corolla • BCD-5678",
    time: "Hoje, 10:30",
    status: "Concluído",
    ok: true,
  },
  {
    client: "João Ferreira",
    service: "Lavagem Simples",
    vehicle: "Honda Civic • EFG-9012",
    time: "Hoje, 09:15",
    status: "Concluído",
    ok: true,
  },
  {
    client: "Ana Rodrigues",
    service: "Lavagem Premium + Cera",
    vehicle: "BMW X5 • ABC-1234",
    time: "Hoje, 08:00",
    status: "Em andamento",
    ok: null,
  },
  {
    client: "Pedro Costa",
    service: "Lavagem Simples",
    vehicle: "Volkswagen Golf • HIJ-3456",
    time: "Ontem, 17:45",
    status: "Concluído",
    ok: true,
  },
  {
    client: "Carla Lima",
    service: "Lavagem Premium",
    vehicle: "Fiat Argo • KLM-7890",
    time: "Ontem, 16:30",
    status: "Cancelado",
    ok: false,
  },
];

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "veiculos", label: "Veículos", icon: Car },
  { key: "planos", label: "Planos", icon: Package },
  { key: "lavagens", label: "Lavagens", icon: Droplets },
  { key: "receita", label: "Receita", icon: DollarSign },
  { key: "solicitacoes", label: "Solicitações", icon: AlertCircle },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 min-h-screen border-r border-[#2A2A2A] sticky top-0"
        style={{ background: "#111111" }}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#2A2A2A]">
          <p className="text-[10px] text-[#9CA3AF] tracking-widest uppercase font-medium mb-0.5">
            Portal
          </p>
          <h1 className="text-xl font-bold">
            <span className="gold-gradient-text">DGN</span>{" "}
            <span className="text-white">Admin</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                    : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={17} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.key === "solicitacoes" && (
                  <span className="ml-auto text-[10px] font-bold bg-[#F97316] text-white px-1.5 py-0.5 rounded-full">
                    12
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[#2A2A2A]">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all">
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
            <nav className="flex-1 px-3 py-4 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive ? "bg-[#C9A84C]/10 text-[#C9A84C]" : "text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
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
              <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-[#9CA3AF] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 rounded-lg">
              24/06/2026
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
          {/* KPI Grid */}
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

          {/* Recent Activity */}
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
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {act.ok === true ? (
                      <CheckCircle2 size={18} className="text-[#34D399]" />
                    ) : act.ok === false ? (
                      <XCircle size={18} className="text-red-400" />
                    ) : (
                      <Clock size={18} className="text-[#C9A84C]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{act.client}</p>
                        <p className="text-xs text-[#9CA3AF] truncate">{act.service}</p>
                        <p className="text-[11px] text-[#4B5563] mt-0.5 truncate">{act.vehicle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              act.ok === true
                                ? "rgba(52,211,153,0.1)"
                                : act.ok === false
                                ? "rgba(248,113,113,0.1)"
                                : "rgba(201,168,76,0.1)",
                            color:
                              act.ok === true
                                ? "#34D399"
                                : act.ok === false
                                ? "#F87171"
                                : "#C9A84C",
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
        </div>
      </main>
    </div>
  );
}
