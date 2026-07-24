"use client";

import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";
import { useState, Suspense } from "react";

function LoginForm() {
  const [show, setShow] = useState(false);
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "invalid";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0F0F0F] p-6 space-y-4">
      {hasError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3">
          <p className="text-sm text-red-400">Senha incorreta.</p>
        </div>
      ) : null}

      <form action="/admin/growth/session" method="post" className="space-y-4">

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D7D7D]">
            Senha administrativa
          </span>
          <div className="relative mt-2">
            <input
              type={show ? "text" : "password"}
              name="password"
              required
              autoFocus
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] pl-4 pr-10 text-sm text-white outline-none placeholder:text-[#555] focus:border-[#C9A84C]/40 focus:ring-1 focus:ring-[#C9A84C]/15"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
              tabIndex={-1}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-[linear-gradient(135deg,#C9A84C,#F0D060)] text-sm font-semibold text-[#080808] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default function AdminGrowthLoginPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[linear-gradient(135deg,#C9A84C,#F0D060)]">
              <Lock size={24} className="text-[#080808]" />
            </div>
            <div className="absolute -inset-1 rounded-2xl opacity-25 blur-md bg-[linear-gradient(135deg,#C9A84C,#F0D060)]" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            DGN Growth
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Acesso restrito</h1>
          <p className="mt-1 text-sm text-[#7D7D7D]">Área interna da equipe DGN</p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex items-center justify-center gap-2 text-[#3D3D3D]">
          <Shield size={12} />
          <span className="text-[11px] tracking-wide">
            Rota protegida — dados reais de clientes
          </span>
        </div>
      </div>
    </div>
  );
}
