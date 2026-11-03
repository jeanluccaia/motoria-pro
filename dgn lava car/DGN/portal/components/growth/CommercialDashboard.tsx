import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleCheck, Sparkles } from "lucide-react";
import type { DailyBriefing } from "@/lib/growth/agent/types";
import type { PulseSummary } from "@/lib/growth/db/pulse-summary";

type Metrics = {
  activeCustomers: number | null;
  activeSubscriptions: number | null;
  pendingRenewal: number;
  confirmedFounders: number;
  activeInvites: number;
  awaitingCuration: number;
  dataOrigin: "json" | "db" | "json-fallback";
  loadError: string | null;
};
type Fleet = { total: number; waitingUnit: number; waitingManager: number; error: string | null };
const inbox = "/admin/growth/intelligence/inbox";
const subscribers = "/admin/growth/assinantes-detectados";

export function CommercialDashboard({ metrics: m, briefing, pulse, fleet }: {
  metrics: Metrics;
  briefing: { briefing: DailyBriefing | null; error: string | null };
  pulse: PulseSummary;
  fleet: Fleet;
}) {
  const commercial = pulse.topActions.filter(a => a.kind === "opportunity" || a.kind === "campaign_draft");
  const operational = pulse.topActions.filter(a => a.kind === "alert" || a.kind === "followup_task");
  const commercialCount = pulse.counts.opportunity + pulse.counts.campaignDraft;
  const hasTasks = commercial.length > 0 || (!fleet.error && fleet.total > 0) || (!m.loadError && m.awaitingCuration > 0) || m.pendingRenewal > 0;
  const unavailable = [m.loadError ? "Indicadores comerciais" : null, pulse.loadError ? "Oportunidades e campanhas" : null, fleet.error ? "Solicitações de frota" : null].filter(Boolean);

  return (
    <div className="dgn-page">
      <header className="dgn-page-header">
        <div>
          <p className="dgn-eyebrow">Gestão comercial</p>
          <h1>Visão Geral</h1>
        </div>
        <Link href={inbox} className="dgn-button dgn-button-primary">Revisar oportunidades <ArrowUpRight size={15} /></Link>
      </header>

      {unavailable.length > 0 ? <p role="status" className="dgn-notice">Indisponível no momento: {unavailable.join(" · ")}. Tente novamente mais tarde.</p> : null}

      <section aria-label="Indicadores de desempenho" data-testid="dashboard-subscriptions">
        <dl className="dgn-metric-strip" data-testid="dashboard-metrics">
          <Metric label="Assinantes ativos" value={m.activeCustomers} testid="metric-active-subscribers" hint={m.activeSubscriptions !== null && m.activeCustomers !== null && m.activeSubscriptions > m.activeCustomers ? `${m.activeSubscriptions} assinaturas ativas` : undefined} />
          <Metric label="Founders confirmados" value={m.confirmedFounders} testid="metric-confirmed-founders" />
          <Metric label="Convites em aberto" value={m.loadError ? null : m.activeInvites} testid="metric-active-invites" />
          <Metric label="Aguardando curadoria" value={m.loadError ? null : m.awaitingCuration} testid="metric-awaiting-curation" />
          <Metric label="Renovações pendentes" value={m.pendingRenewal} testid="metric-pending-renewal" hint="Base consolidada" />
        </dl>
      </section>

      <div className="dgn-dashboard-grid">
        <div className="min-w-0">
          <section aria-labelledby="priority-heading">
            <div className="dgn-section-heading">
              <h2 id="priority-heading">Ações prioritárias</h2>
              {!pulse.loadError && commercialCount > 0 ? <span>{commercialCount} para revisão</span> : null}
            </div>
            <div className="dgn-queue">
              <div className="dgn-queue-labels" aria-hidden="true"><span>Próxima ação</span><span>Situação</span><span className="text-right">Acessar</span></div>
              <ul aria-label="Fila comercial">
                {commercial.slice(0, 5).map(a => <ActionRow key={a.id} title={a.title} context={a.recommendation} status={a.kind === "campaign_draft" ? "Aprovação pendente" : "Revisão pendente"} href={`${inbox}#action-${a.id}`} cta={a.kind === "campaign_draft" ? "Revisar" : "Analisar"} />)}
                {!fleet.error && fleet.waitingUnit > 0 ? <ActionRow title={`${fleet.waitingUnit} ${fleet.waitingUnit === 1 ? "solicitação de frota" : "solicitações de frota"}`} context="Confirme a data ou envie uma contraproposta." status="Aguarda unidade" href="/admin/growth/empresas" cta="Responder" testid="dashboard-fleet" /> : null}
                {!fleet.error && fleet.waitingManager > 0 ? <ActionRow title={`${fleet.waitingManager} ${fleet.waitingManager === 1 ? "contraproposta enviada" : "contrapropostas enviadas"}`} context="Aguardando a decisão do gestor da empresa." status="Aguarda gestor" href="/admin/growth/empresas" cta="Acompanhar" /> : null}
                {!m.loadError && m.awaitingCuration > 0 ? <ActionRow title={`${m.awaitingCuration} ${m.awaitingCuration === 1 ? "cliente aguarda" : "clientes aguardam"} curadoria`} context="Revise o perfil e defina o próximo contato." status="Análise pendente" href="/admin/growth/curadoria" cta="Avaliar" /> : null}
                {m.pendingRenewal > 0 ? <ActionRow title={`${m.pendingRenewal} ${m.pendingRenewal === 1 ? "renovação pendente" : "renovações pendentes"}`} context="Acompanhe os contratos da base consolidada." status="Acompanhar" href={subscribers} cta="Ver contratos" /> : null}
              </ul>
              {!hasTasks ? <div className="dgn-empty"><CircleCheck size={20} className="mb-3 text-white/45" /><p className="font-medium text-white/80">{unavailable.length ? "As pendências disponíveis aparecerão aqui." : "Nenhuma ação comercial pendente."}</p><p className="mt-1">{unavailable.length ? "Algumas fontes não puderam ser consultadas." : "Consulte os clientes ou o assistente para continuar."}</p></div> : null}
              {commercialCount > 5 ? <Link href={inbox} className="dgn-quiet-link px-5">Ver todas as {commercialCount} ações comerciais <ArrowRight size={14} /></Link> : null}
            </div>
          </section>

          {!pulse.loadError && operational.length > 0 ? <section className="dgn-operations" aria-labelledby="operations-heading" data-testid="dashboard-pulse">
            <div className="dgn-section-heading"><h2 id="operations-heading">Acompanhamento operacional</h2><span>{pulse.counts.alert + pulse.counts.followupTask} pendências</span></div>
            <ul>{operational.slice(0, 3).map(a => <li key={a.id}><span>{a.title}</span><Link className="dgn-action-link" href={`${inbox}#action-${a.id}`}>Revisar <ArrowRight size={13} /></Link></li>)}</ul>
          </section> : null}
        </div>

        <aside className="dgn-dashboard-aside" aria-label="Atalhos comerciais">
          <section>
            <div className="dgn-section-heading"><h2>Acesso rápido</h2></div>
            <QuickLink href="/admin/growth/intelligence" label="Clientes" />
            <QuickLink href={subscribers} label="Assinaturas" />
            <QuickLink href="/admin/growth/empresas" label="Frotas corporativas" />
            <QuickLink href="/admin/growth/founders-2026" label="Campanha Founders" />
          </section>
          <section className="mt-7 xl:border-t xl:border-white/[0.08] xl:pt-6">
            <div className="dgn-section-heading"><h2 className="flex items-center gap-2"><Sparkles size={15} className="text-[#c9a84c]" /> Assistente DGN</h2></div>
            <p className="text-xs leading-relaxed text-white/55">{briefing.error || !briefing.briefing ? "Análise indisponível no momento." : briefing.briefing.totalOpportunities > 0 ? `${briefing.briefing.totalOpportunities} sinais comerciais para avaliar.` : "Nenhum sinal prioritário identificado."}</p>
            <QuickLink href="/admin/growth/assistente" label="Consultar briefing" />
            <p className="mt-3 text-[11px] leading-relaxed text-white/45">Sugestões aguardam sua decisão. Aprovar e registrar a execução são etapas distintas.</p>
          </section>
        </aside>
      </div>
      <footer className="dgn-source">Fonte: {m.dataOrigin === "db" ? "Base operacional" : m.dataOrigin === "json-fallback" ? "Base local · fonte principal indisponível" : "Base local"}</footer>
    </div>
  );
}

function Metric({ label, value, hint, testid }: { label: string; value: number | null; hint?: string; testid: string }) {
  return <div className="dgn-metric" data-testid={testid}><dt>{label}</dt><dd data-testid={`${testid}-value`}>{value === null ? "—" : value.toLocaleString("pt-BR")}</dd>{hint ? <small>{hint}</small> : null}</div>;
}
function ActionRow({ title, context, status, href, cta, testid }: { title: string; context: string; status: string; href: string; cta: string; testid?: string }) {
  return <li className="dgn-action-row" data-testid={testid}><div><h3>{title}</h3><p>{context}</p></div><span className="dgn-action-status">{status}</span><Link href={href} className="dgn-action-link">{cta}<ArrowRight size={13} /></Link></li>;
}
function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="dgn-quiet-link">{label}<ArrowUpRight size={14} className="text-white/35" /></Link>;
}
