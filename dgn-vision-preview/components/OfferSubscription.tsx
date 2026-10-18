"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { IconArrow, IconCheck } from "@/components/Icons";
import type { Plan } from "@/lib/data";

type PlanInfo = {
  key: Plan;
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  included: string[];
  highlighted?: boolean;
};

const PLANS: PlanInfo[] = [
  {
    key: "essential",
    name: "Essential",
    tagline: "Cuidado consistente, sem complicação",
    price: "R$ 189",
    cadence: "/ mês",
    included: [
      "Lavagem premium mensal",
      "Higienização externa + rodas",
      "Agendamento prioritário em slot aberto",
      "Relatório trimestral de cuidado",
    ],
  },
  {
    key: "smart",
    name: "Smart",
    tagline: "O equilíbrio ideal entre frequência e proteção",
    price: "R$ 329",
    cadence: "/ mês",
    included: [
      "Lavagem premium quinzenal",
      "Higienização interna rotativa",
      "Enceramento técnico trimestral",
      "Avaliação estética semestral",
      "Agendamento garantido",
    ],
    highlighted: true,
  },
  {
    key: "priority",
    name: "Priority",
    tagline: "O programa dos clientes que exigem o máximo",
    price: "R$ 596",
    cadence: "/ mês",
    included: [
      "Dois atendimentos premium por mês",
      "Correção leve de pintura inclusa",
      "Proteção cerâmica anual",
      "Lounge exclusivo + horário reservado",
      "Gerente de conta dedicado",
    ],
  },
];

type Props = {
  trigger?: React.ReactNode;
  customerName: string;
  recommended?: Plan;
  // Modo controlado (ex: via Modo Apresentação)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialStage?: "select" | "confirmation";
  initialPlan?: Plan;
};

export function OfferSubscription({
  trigger,
  customerName,
  recommended = "priority",
  open: controlledOpen,
  onOpenChange,
  initialStage = "select",
  initialPlan,
}: Props) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const [selected, setSelected] = useState<Plan | null>(initialPlan ?? null);
  const [confirmed, setConfirmed] = useState(initialStage === "confirmation");

  const dialogRef = useRef<HTMLDivElement>(null);

  function setOpen(v: boolean) {
    if (isControlled) {
      onOpenChange?.(v);
    } else {
      setInternalOpen(v);
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      if (!isControlled) {
        setSelected(null);
        setConfirmed(false);
      }
    }, 180);
  }

  // Sincroniza quando mudam props controladas
  useEffect(() => {
    if (isControlled) {
      setConfirmed(initialStage === "confirmation");
      setSelected(initialPlan ?? null);
    }
  }, [controlledOpen, initialStage, initialPlan, isControlled]);

  // Esc fecha
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

  // Focus trap simples
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

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
            {confirmed ? (
              <ConfirmedScreen
                planKey={selected ?? recommended}
                customerName={customerName}
                onClose={close}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <p className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                      Oferta demonstrativa — sem contrato ou cobrança
                    </p>
                    <h2
                      id="offer-dialog-title"
                      className="mt-3 text-2xl lg:text-[28px] font-semibold text-white tracking-tight"
                    >
                      Qual plano apresentar para {customerName}?
                    </h2>
                    <p className="mt-2 text-ink-300 max-w-xl">
                      Três faixas, uma decisão. Selecionar um plano aqui apenas
                      prepara a conversa com o cliente.
                    </p>
                  </div>
                  <button onClick={close} className="btn-subtle" aria-label="Fechar">
                    Fechar · <span className="kbd">Esc</span>
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => {
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
                        <p className="text-sm text-ink-300 mt-1 min-h-[42px]">
                          {plan.tagline}
                        </p>

                        <div className="mt-5 flex items-baseline gap-1">
                          <span className="text-3xl font-semibold text-white tabular-nums">
                            {plan.price}
                          </span>
                          <span className="text-sm text-ink-400">
                            {plan.cadence}
                          </span>
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
                  <div className="text-xs text-ink-400 max-w-md leading-relaxed">
                    Em produção, a seleção prepara o convite por WhatsApp e abre o
                    checkout no PagBank. A assinatura só é criada após aceite real
                    do cliente — nada é cobrado aqui.
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={close} className="btn-ghost">
                      Cancelar
                    </button>
                    <button
                      disabled={!selected}
                      onClick={() => setConfirmed(true)}
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
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmedScreen({
  planKey,
  customerName,
  onClose,
}: {
  planKey: Plan;
  customerName: string;
  onClose: () => void;
}) {
  const plan = PLANS.find((p) => p.key === planKey)!;
  return (
    <div className="py-6">
      <div className="w-14 h-14 rounded-2xl bg-gold-400/15 text-gold-300 flex items-center justify-center mb-6">
        <IconCheck size={28} />
      </div>
      <p className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
        Preparação demonstrativa
      </p>
      <h2 className="mt-3 text-2xl lg:text-[28px] text-white font-semibold tracking-tight">
        Oferta <span className="text-gold-300">{plan.name}</span> preparada para{" "}
        {customerName}
      </h2>
      <p className="mt-3 text-ink-200 max-w-xl leading-relaxed">
        Em produção, agora enviaríamos o convite por WhatsApp com link seguro de
        aceite, apresentaríamos o plano no lounge ou agendaríamos a conversa.
        Nenhum contrato foi criado e nenhuma cobrança foi disparada.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-400">
            Valor mensal
          </p>
          <p className="text-xl font-semibold text-white mt-1">{plan.price}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-400">
            Formato
          </p>
          <p className="text-xl font-semibold text-white mt-1">Mensalidade</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-400">
            Previsão de aceite
          </p>
          <p className="text-xl font-semibold text-white mt-1">até 48h</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <button
          onClick={onClose}
          className="btn-primary"
          title="Fechar demonstração"
        >
          Voltar ao cliente <IconArrow size={14} />
        </button>
        <span className="text-xs text-ink-400">
          Envio por WhatsApp, lounge e agendamento ficam disponíveis na próxima
          fase.
        </span>
      </div>
    </div>
  );
}
