"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Plus, ArrowRight, Loader2 } from "lucide-react";
import type { CompanyRow } from "@/lib/growth/db/corporate-fleet-write";

export function CompaniesAdmin({
  companies,
  pendingByCompany,
}: {
  companies: CompanyRow[];
  pendingByCompany: Record<string, number>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const visibleCompanies = companies.filter(company => {
    if (pendingOnly && !(pendingByCompany[company.id] > 0)) return false;
    return [company.displayName, company.legalName, company.cnpj ?? ""].some(value =>
      value.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")),
    );
  });
  const [form, setForm] = useState({
    legalName: "",
    displayName: "",
    cnpj: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
  });
  const [busy, setBusy] = useState<"idle" | "pending" | { error: string }>("idle");

  async function submit() {
    if (!form.legalName.trim() || !form.displayName.trim()) {
      setBusy({ error: "Razão social e nome de exibição são obrigatórios." });
      return;
    }
    setBusy("pending");
    try {
      const r = await fetch("/api/admin/growth/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "same-origin",
      });
      if (!r.ok) {
        const b = (await r.json().catch(() => ({}))) as { error?: string };
        setBusy({ error: b.error ?? `Erro ${r.status}` });
        return;
      }
      window.location.reload();
    } catch (error) {
      setBusy({ error: error instanceof Error ? error.message : "Erro de rede" });
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-4">
      {companies.length > 0 ? <div className="dgn-company-summary"><span><strong>{companies.length}</strong> empresas</span><span><strong>{Object.values(pendingByCompany).reduce((sum, n) => sum + n, 0)}</strong> solicitações em aberto</span></div> : null}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-4 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14]"
          data-testid="btn-new-company"
        >
          <Plus size={14} />
          Cadastrar empresa
        </button>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
            Nova empresa contratante
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Razão social *" value={form.legalName} onChange={(v) => setForm({ ...form, legalName: v })} />
            <Field label="Nome de exibição *" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
            <Field label="E-mail de contato" type="email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} />
            <Field label="Telefone" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
            <Field label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
          {typeof busy === "object" ? (
            <p className="mt-3 text-xs text-amber-200">{busy.error}</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy === "pending"}
              onClick={submit}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-3 text-sm font-medium text-[#E7C96A] transition hover:bg-[#C9A84C]/[0.14] disabled:opacity-40"
              data-testid="btn-submit-company"
            >
              {busy === "pending" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Cadastrar
            </button>
          </div>
        </div>
      )}

      {companies.length > 0 ? (
        <ul className="dgn-company-list" data-testid="companies-list">
          {companies.map((c) => {
            const pending = pendingByCompany[c.id] ?? 0;
            return (
              <li key={c.id} className="transition">
                <Link href={`/admin/growth/empresas/${c.id}`} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-medium text-white">{c.displayName}</p>
                    <p className="truncate text-xs text-white/55">
                      {c.legalName}
                      {c.cnpj ? ` · ${c.cnpj}` : ""}
                    </p>
                  </div>
                  {pending > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                      {pending} em aberto
                    </span>
                  ) : null}
                  <ArrowRight size={16} className="shrink-0 text-white/40" />
                </Link>
              </li>
            );
          })}
        </ul>
        {visibleCompanies.length === 0 ? <p className="py-8 text-center text-sm text-white/55">Nenhuma empresa encontrada. Revise a busca e os filtros.</p> : null}
        </>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-white placeholder:text-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
      />
    </label>
  );
}
