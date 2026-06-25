"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Droplets, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(201,168,76,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
              }}
            >
              <Droplets size={28} className="text-[#0A0A0A]" />
            </div>
            <div
              className="absolute -inset-1 rounded-2xl opacity-30 blur-md"
              style={{ background: "linear-gradient(135deg, #C9A84C, #F0D060)" }}
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gold-gradient-text">DGN</span>{" "}
            <span className="text-white">Club</span>
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1 tracking-wide">
            Seu carro merece o melhor
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-[#9CA3AF] tracking-wider uppercase mb-2 block">
              E-mail ou Telefone
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9CA3AF] tracking-wider uppercase mb-2 block">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-[#0A0A0A] transition-all duration-200 disabled:opacity-70 active:scale-[0.98]"
            style={{
              background: isLoading
                ? "#9CA3AF"
                : "linear-gradient(135deg, #C9A84C 0%, #F0D060 50%, #C9A84C 100%)",
              boxShadow: isLoading ? "none" : "0 4px 20px rgba(201, 168, 76, 0.3)",
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>

          <button
            type="button"
            className="w-full text-center text-sm text-[#9CA3AF] hover:text-[#C9A84C] transition-colors py-1"
          >
            Esqueci minha senha
          </button>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-[#9CA3AF]">
            Ainda não sou assinante?{" "}
            <Link href="/plano" className="text-[#C9A84C] font-medium hover:underline transition-all">
              Conheça os planos
            </Link>
          </p>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-[#4B5563]"
        >
          <Shield size={12} />
          <span className="text-[11px] tracking-wide">Acesso seguro e criptografado</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
