"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { IconArrow, IconCheck } from "@/components/Icons";
import {
  PLAN_CATALOG,
  PLANS_ARRAY,
  demoNow,
  type Customer,
  type PlanKey,
} from "@/lib/data";
import { setOffer } from "@/lib/offerStore";

type Props = {
  customer: Customer;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialStage?: "select" | "confirmation";
  initialPlan?: PlanKey;
  trigger?: React.ReactNode;
};

export function OfferSubscription({
  customer,
  open: controlledOpen,
  onOpenChange,
  initialStage = "select",
  initialPlan,
  trigger,
}: Props) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const kind = customer.opportunity.kind;
  const recommended = customer.opportunity.recommendedPlan ?? "priority";

  const [selected, setSelected] = useState<PlanKey | null>(
    initialPlan ?? recommended
  );
  const [stage, setStage] = useState<"select" | "confirmation">(initialStage);
  const dialogRef = useRef<HTMLDivElement>(null);

  function setOpen(v: boolean) {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  }

  function close() {
    setOpen(false);
  }

  // Sincroniza quando props controladas mudam
  useEffect(() => {
    if (isControlled) {
      setStage(initialStage);
      setSelected(initialPlan ?? recommended);
    }
  }, [controlledOpen, initialStage, initialPlan, isControlled, recommended]);

  // Esc fecha o modal (stopPropagation para o Provider não encerrar apresentação ao mesmo tempo)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  function handlePrepare() {
    if (kind === "corporate") {
      setOffer({
        customerId: customer.id,
        kind,
        status: "prepared",
        updatedAt: demoNow(),
      });
    } else if (selected) {
      setOffer({
        customerId: customer.id,
        kind,
        planKey: selected,
        status: "prepared",
        updatedAt: demoNow(),
      });
    }
    setStage("confirmation");
  }

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger}
        </span>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-dialog-title"
        >
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={close}
          />
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto surface-raised p-6 lg:p-10 outline-none"
          >
            {stage === "confirmation" ? (
              <ConfirmedScreen
                customer={customer}
                planKey={selected ?? recommended}
                onClose={close}
              />
            ) : kind === "corporate" ? (
              <CorporateOffer
                customer={customer}
                onCancel={close}
                onPrepare={handlePrepare}
              />
            ) : (
              <PlanOffer
                customer={customer}
                kind={kind}
                selected={selected}
                setSelected={setSelected}
                recommended={recommended}
                onCancel={close}
                onPrepare={handlePrepare}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* -------- OFERTA DE PLANO (nova ou upgrade) -------- */

function PlanOffer({
  customer,
  kind,
  selected,
  setSelected,
  recommended,
  onCancel,
  onPrepare,
}: {
  customer: Customer;
  kind: "new_subscription" | "upgrade";
  selected: PlanKey | null;
  setSelected: (p: PlanKey) => void;
  recommended: PlanKey;
  onCancel: () => void;
  onPrepare: () => void;
}) {
  const currentPlan = customer.plan;
  const visiblePlans = kind === "upgrade"
    ? PLANS_ARRAY.filter((p) =>
        currentPlan ? p.key !== currentPlan.key : true
      )
    : PLANS_ARRAY;

  return (
    <>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
            {kind === "upgrade" ? "Upgrade de assinatura" : "Nova assinatura"} ·
            demonstrativo
          </p>
          <h2
            id="offer-dialog-title"
            className="mt-3 text-2xl lg:text-[28px] font-semibold text-white tracking-tight"
          >
            {kind === "upgrade"
              ? `Para onde evoluir a assinatura de ${customer.firstName}?`
              : `Qual plano apresentar para ${customer.firstName}?`}
          </h2>
          {kind === "upgrade" && currentPlan && (
            <p className="mt-2 text-ink-200">
              Hoje: <strong className="text-white">DGN {currentPlan.label}</strong>{" "}
              · {currentPlan.priceDisplay} / mês
            </p>
          )}
          <p className="mt-2 text-ink-200 max-w-xl">
            Nenhum contrato é criado aqui. A escolha prepara a conversa com o
            cliente — você pode acompanhar o estado da oferta na ficha
          </p>
        </div>
        <button onClick={onCancel} className="btn-subtle" aria-label="Fechar">
          Fechar · <span className="kbd">Esc</span>
        </button>
      </div>

      <div
        className={`mt-8 grid grid-cols-1 ${
          visiblePlans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        } gap-4`}
      >
        {visiblePlans.map((plan) => {
          const isRec = plan.key === recommended;
          const isSel = selected === plan.key;
          return (
            <button
              key={plan.key}
              onClick={() => setSelected(plan.key)}
              className={clsx(
                "text-left relative rounded-2xl p-6 border transition-all",
                isSel
                  ? "border-gold-400 bg-gold-400/[0.05] shadow-gold"
                  : "border-white/5 bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/10"
              )}
            >
              {isRec && (
                <span className="absolute -top-2.5 left-6 pill bg-gold-400 text-ink-950 border border-gold-500">
                  Recomendado
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {plan.name}
                </h3>
                {isSel && (
                  <span className="w-6 h-6 rounded-full bg-gold-400 text-ink-950 flex items-center justify-center">
                    <IconCheck size={14} />
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-200 mt-1 min-h-[42px]">
                {plan.tagline}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-white tabular-nums">
                  {plan.priceDisplay}
                </span>
                <span className="text-sm text-ink-300">{plan.cadence}</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {plan.included.map((it) => (
                  <li
                    key={it}
                    className="flex items-start gap-2.5 text-sm text-ink-100"
                  >
                    <span className="mt-1 w-4 h-4 rounded-full bg-gold-400/15 text-gold-300 flex items-center justify-center shrink-0">
                      <IconCheck size={10} />
                    </span>
                    <span className="leading-snug">{it}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 flex-wrap pt-6 border-t border-white/5">
        <div className="text-xs text-ink-200 max-w-md leading-relaxed">
          Em produção, a seleção abre o checkout no PagBank e envia o convite por
          WhatsApp. A assinatura só é criada após aceite real do cliente — nada é
          cobrado aqui.
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
          <button
            disabled={!selected}
            onClick={onPrepare}
            className={clsx(
              "btn-primary",
              !selected && "opacity-40 pointer-events-none"
            )}
          >
            Preparar oferta <IconArrow size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/* -------- OFERTA CORPORATIVA -------- */

function CorporateOffer({
  customer,
  onCancel,
  onPrepare,
}: {
  customer: Customer;
  onCancel: () => void;
  onPrepare: () => void;
}) {
  const fleet = customer.opportunity.corporateFleet!;
  const perVehicle = Math.round(fleet.monthlyEstimate / fleet.vehicles);

  return (
    <>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
            Corporate Care · demonstrativo
          </p>
          <h2 className="mt-3 text-2xl lg:text-[28px] font-semibold text-white tracking-tight">
            Oferta corporativa para {customer.name}
          </h2>
          <p className="mt-2 text-ink-200 max-w-xl">
            Contrato empresarial único que estende o cuidado DGN aos veículos
            corporativos identificados no CNPJ do titular.
          </p>
        </div>
        <button onClick={onCancel} className="btn-subtle">
          Fechar · <span className="kbd">Esc</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-6">
          <p className="text-[11px] uppercase tracking-wider text-ink-300">
            Veículos corporativos
          </p>
          <p className="mt-2 text-4xl font-semibold text-white tabular-nums">
            {fleet.vehicles}
          </p>
          <p className="mt-1 text-xs text-ink-300">
            identificados no CNPJ titular
          </p>
        </div>
        <div className="rounded-2xl border border-gold-400/20 bg-gold-400/[0.05] p-6">
          <p className="text-[11px] uppercase tracking-wider text-gold-300">
            Mensalidade estimada
          </p>
          <p className="mt-2 text-4xl font-semibold text-white tabular-nums">
            {fleet.monthlyDisplay}
          </p>
          <p className="mt-1 text-xs text-ink-200">
            {fleet.vehicles} × R$ {perVehicle} / veículo
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-6">
          <p className="text-[11px] uppercase tracking-wider text-ink-300">
            Formato
          </p>
          <p className="mt-2 text-lg font-semibold text-white leading-tight">
            Contrato empresarial único
          </p>
          <p className="mt-1 text-xs text-ink-300">
            NF-e consolidada mensal · gerente de conta dedicado
          </p>
        </div>
      </div>

      <div className="mt-6 p-5 rounded-xl border border-white/5 bg-white/[0.015]">
        <p className="text-[11px] uppercase tracking-wider text-ink-300">
          Projeção ilustrativa
        </p>
        <p className="mt-2 text-sm text-ink-100 leading-relaxed">
          {customer.opportunity.projection.explain}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 flex-wrap pt-6 border-t border-white/5">
        <div className="text-xs text-ink-200 max-w-md leading-relaxed">
          Em produção, isso abriria uma reunião no calendário do gerente comercial
          e enviaria o briefing corporativo para o titular. Aqui apenas registramos
          que a oferta foi preparada.
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
          <button onClick={onPrepare} className="btn-primary">
            Preparar oferta corporativa <IconArrow size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/* -------- CONFIRMAÇÃO -------- */

function ConfirmedScreen({
  customer,
  planKey,
  onClose,
}: {
  customer: Customer;
  planKey: PlanKey;
  onClose: () => void;
}) {
  const plan = PLAN_CATALOG[planKey];
  const isCorporate = customer.opportunity.kind === "corporate";

  return (
    <div className="py-6">
      <div className="w-14 h-14 rounded-2xl bg-gold-400/15 text-gold-300 flex items-center justify-center mb-6">
        <IconCheck size={28} />
      </div>
      <p className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
        Preparação demonstrativa
      </p>
      <h2 className="mt-3 text-2xl lg:text-[28px] text-white font-semibold tracking-tight">
        {isCorporate ? (
          <>Oferta <span className="text-gold-300">Corporate Care</span> preparada
          para {customer.firstName}</>
        ) : (
          <>Oferta <span className="text-gold-300">{plan.name}</span> preparada
          para {customer.firstName}</>
        )}
      </h2>
      <p className="mt-3 text-ink-200 max-w-xl leading-relaxed">
        O estado da oferta ficou visível na ficha do cliente. Em produção, agora
        enviaríamos o convite por WhatsApp, apresentaríamos o plano no lounge ou
        agendaríamos a conversa. Nenhum contrato foi criado e nenhuma cobrança
        foi disparada.
      </p>

      {!isCorporate && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-ink-300">
              Valor mensal
            </p>
            <p className="text-xl font-semibold text-white mt-1">
              {plan.priceDisplay}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-ink-300">
              Formato
            </p>
            <p className="text-xl font-semibold text-white mt-1">Mensalidade</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wider text-ink-300">
              Previsão de aceite
            </p>
            <p className="text-xl font-semibold text-white mt-1">até 48h</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <button onClick={onClose} className="btn-primary">
          Voltar à ficha <IconArrow size={14} />
        </button>
        <span className="text-xs text-ink-300">
          Envio por WhatsApp, lounge e agendamento ficam disponíveis na próxima
          fase.
        </span>
      </div>
    </div>
  );
}
