"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Car,
  Briefcase,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { whatsappAtendimento } from "@/lib/config";

// Tipos estruturados para futura integração com banco de dados
interface PersonalData {
  nomeCompleto: string;
  email: string;
  telefonePrincipal: string;
  whatsapp: string;
  dataNascimento: string;
}

interface VehicleData {
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  placa: string;
  tipoUso: "particular" | "empresa" | "reembolso" | "frota" | "";
  possuiMaisVeiculos: boolean;
  veiculoConjuge: boolean;
}

interface CommercialData {
  empresa: string;
  cargo: string;
  origemRelacionamento: string;
  referencia: string;
  interesses: string[];
  observacoes: string;
}

const tiposUso = [
  { value: "particular", label: "Particular" },
  { value: "empresa", label: "Empresa" },
  { value: "reembolso", label: "Reembolso empresa" },
  { value: "frota", label: "Frota" },
];

const interesseOptions = [
  "Smart",
  "Priority",
  "Corporate Care",
  "Extras",
  "Ainda validar",
];

const inputClass =
  "w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#C9A84C]/50 transition-colors";

const labelClass = "block text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium mb-1.5";

function SectionHeader({
  icon: Icon,
  title,
  index,
}: {
  icon: React.ElementType;
  title: string;
  index: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(201,168,76,0.1)" }}
      >
        <Icon size={15} className="text-[#C9A84C]" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[#4B5563] font-bold tracking-widest">{index}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  const [personal, setPersonal] = useState<PersonalData>({
    nomeCompleto: "José Moreira",
    email: "",
    telefonePrincipal: "",
    whatsapp: "",
    dataNascimento: "",
  });

  const [vehicle, setVehicle] = useState<VehicleData>({
    marca: "Honda",
    modelo: "Fit",
    ano: "",
    cor: "Prata",
    placa: "",
    tipoUso: "reembolso",
    possuiMaisVeiculos: false,
    veiculoConjuge: false,
  });

  const [commercial, setCommercial] = useState<CommercialData>({
    empresa: "APICE COLABORADOR",
    cargo: "",
    origemRelacionamento: "Empresa / convênio",
    referencia: "",
    interesses: [],
    observacoes: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const toggleInteresse = (item: string) => {
    setCommercial((prev) => ({
      ...prev,
      interesses: prev.interesses.includes(item)
        ? prev.interesses.filter((i) => i !== item)
        : [...prev.interesses, item],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: enviar para API/banco em produção
    console.log("Cadastro atualizado:", { personal, vehicle, commercial });
    setSubmitted(true);
  };

  const waAtendimento = whatsappAtendimento(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-5 pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}
          >
            <CheckCircle2 size={36} className="text-[#34D399]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Cadastro atualizado!</h2>
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-8">
            Seus dados foram enviados com sucesso. Nossa equipe confirmará as informações.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)" }}
          >
            Voltar ao Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-10">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#1A1A1A] px-5 py-4"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Atualizar cadastro</h1>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Dados do assinante DGN Club</p>
          </div>
        </div>
      </motion.header>

      <form onSubmit={handleSubmit} className="px-5 max-w-lg mx-auto pt-6 space-y-5">
        {/* ─── Dados Pessoais ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl p-5"
          style={{ background: "#111111", border: "1px solid #2A2A2A" }}
        >
          <SectionHeader icon={User} title="Dados Pessoais" index={1} />

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nome completo</label>
              <input
                className={inputClass}
                type="text"
                placeholder="Nome completo"
                value={personal.nomeCompleto}
                onChange={(e) => setPersonal({ ...personal, nomeCompleto: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <input
                className={inputClass}
                type="email"
                placeholder="seu@email.com"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Telefone principal</label>
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="(19) 99999-0000"
                  value={personal.telefonePrincipal}
                  onChange={(e) =>
                    setPersonal({ ...personal, telefonePrincipal: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="(19) 99999-0000"
                  value={personal.whatsapp}
                  onChange={(e) => setPersonal({ ...personal, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Data de nascimento (opcional)</label>
              <input
                className={inputClass}
                type="date"
                value={personal.dataNascimento}
                onChange={(e) =>
                  setPersonal({ ...personal, dataNascimento: e.target.value })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* ─── Dados do Veículo ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: "#111111", border: "1px solid #2A2A2A" }}
        >
          <SectionHeader icon={Car} title="Dados do Veículo" index={2} />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Marca</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: Honda"
                  value={vehicle.marca}
                  onChange={(e) => setVehicle({ ...vehicle, marca: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Modelo</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: Fit"
                  value={vehicle.modelo}
                  onChange={(e) => setVehicle({ ...vehicle, modelo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Ano</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: 2021"
                  value={vehicle.ano}
                  onChange={(e) => setVehicle({ ...vehicle, ano: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Cor</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: Prata"
                  value={vehicle.cor}
                  onChange={(e) => setVehicle({ ...vehicle, cor: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Placa</label>
              <input
                className={inputClass}
                type="text"
                placeholder="Ex: ABC-1234"
                value={vehicle.placa}
                onChange={(e) =>
                  setVehicle({ ...vehicle, placa: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Tipo de uso</label>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-10`}
                  value={vehicle.tipoUso}
                  onChange={(e) =>
                    setVehicle({
                      ...vehicle,
                      tipoUso: e.target.value as VehicleData["tipoUso"],
                    })
                  }
                >
                  <option value="">Selecionar...</option>
                  {tiposUso.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  field: "possuiMaisVeiculos" as const,
                  label: "Possui mais veículos?",
                },
                {
                  field: "veiculoConjuge" as const,
                  label: "Veículo do cônjuge / família?",
                },
              ].map(({ field, label }) => (
                <label
                  key={field}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      background: vehicle[field]
                        ? "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)"
                        : "#1A1A1A",
                      border: vehicle[field]
                        ? "none"
                        : "1px solid #3A3A3A",
                    }}
                    onClick={() => setVehicle({ ...vehicle, [field]: !vehicle[field] })}
                  >
                    {vehicle[field] && (
                      <CheckCircle2 size={12} className="text-[#0A0A0A]" />
                    )}
                  </div>
                  <span className="text-sm text-[#9CA3AF]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── Dados Comerciais ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ background: "#111111", border: "1px solid #2A2A2A" }}
        >
          <SectionHeader icon={Briefcase} title="Relacionamento" index={3} />

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Empresa onde trabalha</label>
              <input
                className={inputClass}
                type="text"
                placeholder="Nome da empresa"
                value={commercial.empresa}
                onChange={(e) => setCommercial({ ...commercial, empresa: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Cargo ou vínculo</label>
              <input
                className={inputClass}
                type="text"
                placeholder="Ex: Colaborador, Sócio, Autônomo..."
                value={commercial.cargo}
                onChange={(e) => setCommercial({ ...commercial, cargo: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Como nos conheceu?</label>
              <input
                className={inputClass}
                type="text"
                placeholder="Origem do relacionamento"
                value={commercial.origemRelacionamento}
                onChange={(e) =>
                  setCommercial({ ...commercial, origemRelacionamento: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Referência (opcional)</label>
              <input
                className={inputClass}
                type="text"
                placeholder="Quem indicou?"
                value={commercial.referencia}
                onChange={(e) =>
                  setCommercial({ ...commercial, referencia: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Interesse em planos</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {interesseOptions.map((item) => {
                  const active = commercial.interesses.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInteresse(item)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.15) 100%)"
                          : "#1A1A1A",
                        border: active
                          ? "1px solid rgba(201,168,76,0.5)"
                          : "1px solid #3A3A3A",
                        color: active ? "#C9A84C" : "#6B7280",
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Observações (opcional)</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Algo que deseja nos informar..."
                value={commercial.observacoes}
                onChange={(e) =>
                  setCommercial({ ...commercial, observacoes: e.target.value })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Botão Falar com Atendimento */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <a
            href={waAtendimento}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <MessageCircle size={16} className="text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Falar com Atendimento DGN</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Suporte via WhatsApp</p>
              </div>
            </div>
            <ExternalLink size={14} className="text-[#22C55E]" />
          </a>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-sm font-bold text-[#0A0A0A] tracking-wider uppercase transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 100%)",
              boxShadow: "0 8px 30px rgba(201,168,76,0.25)",
            }}
          >
            Salvar cadastro
          </button>

          <p className="text-center text-[10px] text-[#4B5563] mt-3 leading-relaxed">
            CPF e endereço são opcionais nesta versão.
            <br />
            Dados sensíveis são tratados com sigilo.
          </p>
        </motion.div>
      </form>
    </div>
  );
}
