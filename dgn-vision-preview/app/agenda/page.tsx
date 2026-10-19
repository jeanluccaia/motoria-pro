import Link from "next/link";
import {
  APPOINTMENTS,
  DEMO_DATE,
  DEMO_UNIT,
  appointmentStatus,
  customerById,
  vehicleById,
} from "@/lib/data";
import { IconArrow, IconCalendar } from "@/components/Icons";

export const metadata = {
  title: "Agenda · DGN Vision",
};

export default function AgendaPage() {
  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 space-y-8">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gold-300">
            Agenda · leitura
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold text-white tracking-tight">
            {DEMO_DATE.display}
          </h1>
          <p className="mt-3 text-ink-100">
            {DEMO_UNIT.name} · {APPOINTMENTS.length} atendimentos registrados
          </p>
        </div>
        <span className="pill bg-white/5 text-ink-100 border border-white/10">
          Edição de agenda disponível na próxima fase
        </span>
      </header>

      <section className="surface p-6 lg:p-8">
        <ol className="relative space-y-1">
          <div className="absolute left-[76px] top-2 bottom-2 w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
          {APPOINTMENTS.map((a) => {
            const c = customerById(a.customerId);
            const v = vehicleById(a.vehicleId);
            if (!c || !v) return null;
            const status = appointmentStatus(a);
            const isLive = status === "Em andamento";
            const isPending = status === "A confirmar";
            const isDone = status === "Concluído";
            return (
              <li
                key={a.id}
                className="relative flex items-start gap-5 py-4"
              >
                <div className="w-16 shrink-0 text-right">
                  <p className="text-[11px] uppercase tracking-wider text-ink-300">
                    {a.weekday}
                  </p>
                  <p className="text-sm text-white tabular-nums font-mono mt-0.5">
                    {a.time}
                  </p>
                </div>
                <div
                  className={`relative z-10 shrink-0 mt-2 w-3 h-3 rounded-full ring-4 ${
                    isLive
                      ? "bg-gold-400 ring-gold-400/15"
                      : isPending
                      ? "bg-accent-amber ring-accent-amber/15"
                      : isDone
                      ? "bg-ink-500 ring-ink-500/15"
                      : "bg-accent-emerald ring-accent-emerald/15"
                  }`}
                />
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[16px] text-white font-medium">
                      {a.service}
                    </p>
                    <span
                      className={`pill ${
                        isLive
                          ? "bg-gold-400/10 text-gold-300 border border-gold-400/20"
                          : isPending
                          ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
                          : isDone
                          ? "bg-white/5 text-ink-300 border border-white/10"
                          : "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-200">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-ink-100 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-gold-300"
                    >
                      {c.name}
                    </Link>
                    <span className="text-ink-400"> · </span>
                    {v.make} {v.model}
                    <span className="text-ink-400"> · </span>
                    <span className="font-mono text-ink-200">{v.plate}</span>
                    <span className="text-ink-400"> · </span>
                    {a.bay}
                  </p>
                </div>
                <Link
                  href={`/clientes/${c.id}`}
                  className="btn-subtle shrink-0 self-center"
                  aria-label={`Abrir ficha de ${c.name}`}
                >
                  Abrir ficha <IconArrow size={12} />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="surface p-6 lg:p-8 flex items-start gap-4">
        <span className="w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] text-ink-300 flex items-center justify-center shrink-0">
          <IconCalendar />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Agenda operacional completa
          </h3>
          <p className="mt-1 text-sm text-ink-200 max-w-2xl">
            Esta tela é somente leitura no preview. Reagendamento, encaixe e
            comunicação direta com o cliente estão previstos para a próxima
            fase, integrados ao WhatsApp e ao PagBank
          </p>
        </div>
      </section>
    </div>
  );
}
