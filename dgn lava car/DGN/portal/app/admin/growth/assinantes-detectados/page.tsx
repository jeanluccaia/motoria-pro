import { ShieldCheck, AlertTriangle, Circle } from "lucide-react";
import { buildDetectedSubscribersView, type DetectedSubscriberView } from "@/lib/growth/db/subscribers-view";
import { readSupabaseEnv } from "@/lib/growth/db/client";

export const dynamic = "force-dynamic";

function statusBadge(row: DetectedSubscriberView) {
  if (row.status === "detectado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A84C]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
        <Circle size={8} className="fill-[#C9A84C] text-[#C9A84C]" />
        Detectado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
      <Circle size={8} className="fill-white/50 text-white/50" />
      Pendente validação
    </span>
  );
}

function matchBadge(row: DetectedSubscriberView) {
  const label = {
    match_by_phone: "match por telefone",
    match_by_plate: "match por placa",
    match_by_name: "match por nome",
    no_match: "cliente novo",
  }[row.matchReason];
  const tone = row.matchReason === "no_match"
    ? "text-amber-300 border-amber-300/30 bg-amber-300/5"
    : "text-emerald-300 border-emerald-300/30 bg-emerald-300/5";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}>
      {label}
    </span>
  );
}

export default function AssinantesDetectadosPage() {
  const env = readSupabaseEnv();
  const rows = buildDetectedSubscribersView();
  const dbConfigured = Boolean(env.url && env.serviceRoleKey);
  const detected = rows.filter((r) => r.status === "detectado").length;
  const pending = rows.filter((r) => r.status === "pendente_validacao").length;
  const manualReview = rows.filter((r) => r.requiresManualReview).length;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-white/[0.06] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
            Fila operacional
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
            Assinantes detectados / validação
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#A7A7A7]">
            Clientes com evidência de assinatura ativa vinda da operação 4uCar. Nenhum aparece na
            fila normal de aquisição enquanto o status for detectado ou pendente. Validação exige
            ação humana explícita e motivo.
          </p>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Detectados" value={detected} tone="gold" />
          <StatCard label="Pendentes de validação" value={pending} tone="neutral" />
          <StatCard label="Precisam de revisão manual" value={manualReview} tone="warn" />
        </section>

        {!dbConfigured && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-5 text-sm text-amber-200/90">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold uppercase tracking-wider text-[11px] text-amber-300">
                Persistência ainda não habilitada
              </p>
              <p className="mt-1 leading-relaxed">
                Esta visão está sendo servida a partir do JSON legado + seed de assinantes. Nenhuma
                alteração aqui persiste ainda. As 3 variáveis do Supabase (URL, ANON_KEY,
                SERVICE_ROLE_KEY) precisam estar configuradas na Vercel antes das ações de
                validação, kit e cartão ficarem disponíveis.
              </p>
            </div>
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              <tr>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Plano</th>
                <th className="px-5 py-3">Ciclo</th>
                <th className="px-5 py-3">Placa</th>
                <th className="px-5 py-3">Próximo registro</th>
                <th className="px-5 py-3">Match legado</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.seedName} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{row.displayName}</span>
                      {row.preservedFounderNumber && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-md border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
                          <ShieldCheck size={10} /> Founder Nº{row.preservedFounderNumber}
                        </span>
                      )}
                      {row.isReopenedFounder && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                          Vaga Nº004 reaberta
                        </span>
                      )}
                      {row.requiresManualReview && (
                        <span className="mt-1 text-[10px] uppercase tracking-wider text-amber-300/80">
                          revisão manual
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-white/80">{row.plan}</td>
                  <td className="px-5 py-4 align-top text-white/70">{row.cycle}</td>
                  <td className="px-5 py-4 align-top font-mono text-[12px] text-white/70">
                    {row.plates.join(", ") || "—"}
                  </td>
                  <td className="px-5 py-4 align-top text-white/70">
                    {row.nextScheduledServiceAt ?? "—"}
                  </td>
                  <td className="px-5 py-4 align-top">{matchBadge(row)}</td>
                  <td className="px-5 py-4 align-top">{statusBadge(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-8 rounded-xl border border-white/[0.06] bg-[#101010] p-5 text-xs text-white/50">
          <p className="uppercase tracking-[0.16em] text-white/70">Nota operacional</p>
          <p className="mt-2 leading-relaxed">
            Ninguém desta fila é promovido para <em>ativo</em> sem confirmação humana. Os Founders
            Nº001, Nº002 e Nº003 seguem preservados. A vaga Nº004 está reaberta — Iara aparece aqui
            como assinante detectada, mas <strong>não</strong> como Founder confirmada. Reconhecimento
            posterior exige decisão manual registrada em audit log.
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "gold" | "neutral" | "warn" }) {
  const toneClasses = {
    gold: "border-[#C9A84C]/30 bg-[#C9A84C]/[0.03] text-[#C9A84C]",
    neutral: "border-white/10 bg-white/[0.02] text-white/80",
    warn: "border-amber-300/30 bg-amber-300/[0.03] text-amber-200",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
