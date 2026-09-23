// DGN Diagnósticos — Preview mobile (Fase 0.5)
//
// Componente puro que renderiza como a página vista pelo cliente vai parecer.
// Nesta fase é ADMIN-ONLY: não existe rota pública, não tem token, não tem
// tracking, não bate em Supabase. Só recebe um `DiagnosticDraft` completo e
// desenha a experiência.
//
// Regras invioláveis já aplicadas aqui:
//   * Fotos com `internalOnly=true` NUNCA aparecem.
//   * Áreas com `publicVisible=false` são filtradas do bloco "Pontos".
//   * Média `null` NUNCA vira "0,0" — mostra "Sem avaliação registrada".

import {
  computeDgnAverage,
  computeInvestmentTotalCents,
  countEvaluatedCriteria,
  describeAverageForCustomer,
  formatCents,
  isPartialDiagnostic,
  selectPublicAreas,
  sortPublicAreasBySeverity,
} from "@/lib/growth/diagnostics/computations";
import {
  DGN_SCORE_CRITERIA,
  INSPECTION_CONDITION_OPTIONS,
  getInspectionAreaDef,
  getServiceDef,
  type InspectionCondition,
} from "@/lib/growth/diagnostics/catalog";
import type { DiagnosticDraft } from "@/lib/growth/diagnostics/types";

const shellClass =
  "mx-auto w-full max-w-[380px] bg-[#0A0A0A] text-white shadow-2xl ring-1 ring-white/[0.06] rounded-[28px] overflow-hidden";

const conditionTone: Record<InspectionCondition, string> = {
  not_evaluated:              "border-white/10 bg-white/[0.03] text-white/60",
  good:                       "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-200",
  attention:                  "border-amber-300/30 bg-amber-300/[0.06] text-amber-200",
  intervention_recommended:   "border-red-300/30 bg-red-300/[0.06] text-red-200",
};

function conditionLabel(condition: InspectionCondition): string {
  return INSPECTION_CONDITION_OPTIONS.find((o) => o.value === condition)?.publicLabel ?? "—";
}

// ---------------------------------------------------------------------------

export function DiagnosticPreviewMobile({ draft }: { draft: DiagnosticDraft }) {
  const vehicle = draft.customer.vehicles.find((v) => v.id === draft.selectedVehicleId);
  const average = computeDgnAverage(draft.scores);
  const partial = isPartialDiagnostic(draft.scores);
  const evaluatedCount = countEvaluatedCriteria(draft.scores);
  const publicAreas = sortPublicAreasBySeverity(selectPublicAreas(draft.areas));
  const totalInvestment = computeInvestmentTotalCents(draft.investment);

  return (
    <div className={shellClass}>
      {/* 1) HERO — "Seu veículo" */}
      <section className="relative">
        <IllustrativeHero brand={vehicle?.brand ?? "—"} model={vehicle?.model ?? "—"} color={vehicle?.color ?? "—"} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur">
          Ilustração conceitual · não é foto do seu carro
        </span>
        <div className="border-b border-white/[0.06] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
            Seu veículo
          </p>
          <p className="mt-1 text-lg font-semibold leading-tight">
            {vehicle ? `${vehicle.brand} ${vehicle.model}` : "—"}
          </p>
          <p className="mt-1 text-[12px] text-white/55">
            {vehicle ? `${vehicle.plate} · ${vehicle.color}` : ""}
          </p>
        </div>
      </section>

      {/* 2) AVALIAÇÃO */}
      <section className="border-b border-white/[0.06] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
          Avaliação DGN
        </p>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-4xl font-semibold tabular-nums text-white">
            {average === null ? "—" : average.toFixed(1).replace(".", ",")}
          </span>
          <span className="pb-1 text-[11px] uppercase tracking-[0.16em] text-white/50">
            / 10
          </span>
        </div>
        <p className="mt-1 text-[12px] text-white/70">
          {describeAverageForCustomer(average)}
        </p>
        {partial ? (
          <p className="mt-2 rounded-lg border border-amber-300/25 bg-amber-300/[0.05] px-2.5 py-1.5 text-[11px] text-amber-200">
            Avaliação parcial — {evaluatedCount} de {draft.scores.length} critérios registrados.
          </p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {DGN_SCORE_CRITERIA.map((c) => {
            const entry = draft.scores.find((s) => s.criterionKey === c.key);
            const displayScore = entry && entry.score !== null
              ? entry.score.toFixed(1).replace(".", ",")
              : null;
            return (
              <li
                key={c.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[12px]"
              >
                <span className="text-white/80">{c.label}</span>
                {displayScore ? (
                  <span className="tabular-nums font-semibold text-[#E7C96A]">{displayScore}</span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    Não avaliado
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3) PONTOS ENCONTRADOS */}
      <section className="border-b border-white/[0.06] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
          Pontos encontrados
        </p>
        <p className="mt-1 text-[11px] text-white/50">
          O que a inspeção visual identificou em cada área do carro.
        </p>
        <ul className="mt-4 space-y-3">
          {publicAreas.length === 0 ? (
            <li className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 text-[12px] text-white/55">
              Nenhuma área avaliada visível ainda. Preencha a inspeção pra ver os pontos aqui.
            </li>
          ) : (
            publicAreas.map((area) => {
              const def = getInspectionAreaDef(area.areaKey);
              const publicPhotos = area.photos.filter((p) => !p.internalOnly);
              return (
                <li
                  key={area.areaKey}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-white">{def.label}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${conditionTone[area.condition]}`}
                    >
                      {conditionLabel(area.condition)}
                    </span>
                  </div>
                  {area.observation ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-white/70">
                      {area.observation}
                    </p>
                  ) : null}
                  {publicPhotos.length > 0 ? (
                    <div className="mt-3 flex gap-2 overflow-x-hidden">
                      {publicPhotos.map((photo) => (
                        <MockPhoto
                          key={photo.id}
                          caption={photo.caption}
                          areaLabel={def.label}
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* 4) RECOMENDAÇÃO */}
      <section className="border-b border-white/[0.06] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
          Recomendação
        </p>
        {draft.summary ? (
          <p className="mt-2 text-[13px] leading-relaxed text-white/80">{draft.summary}</p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {draft.recommendations.map((rec) => {
            const svc = getServiceDef(rec.serviceKey);
            return (
              <li
                key={rec.serviceKey}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-white">{svc.label}</span>
                  <PriorityChip priority={rec.priority} />
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-white/60">
                  {rec.reason}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 5) INVESTIMENTO */}
      <section className="border-b border-white/[0.06] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
          Investimento
        </p>
        {draft.investment.length === 0 ? (
          <p className="mt-2 text-[12px] text-white/55">
            Nenhum item de investimento adicionado.
          </p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
              {draft.investment.map((item) => {
                const svc = getServiceDef(item.serviceKey);
                return (
                  <li key={item.serviceKey} className="px-3 py-3 text-[12px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{svc.label}</p>
                        {item.note ? (
                          <p className="mt-0.5 text-[11px] leading-snug text-white/50">{item.note}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        {item.discountPercent > 0 ? (
                          <p className="text-[10px] text-white/40 line-through">
                            {formatCents(item.basePriceCents)}
                          </p>
                        ) : null}
                        <p className="text-[13px] font-semibold text-[#E7C96A] tabular-nums">
                          {formatCents(item.finalPriceCents)}
                        </p>
                        <p className="text-[10px] text-white/45">
                          {item.installments ? `em até ${item.installments}x` : "à vista"}
                          {item.pixEligible ? " · Pix" : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.08] px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E7C96A]">
                Investimento total
              </span>
              <span className="text-[15px] font-semibold text-[#E7C96A] tabular-nums">
                {formatCents(totalInvestment)}
              </span>
            </div>
          </>
        )}
      </section>

      {/* 6) PRÓXIMO PASSO */}
      <section className="px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">
          Próximo passo
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/70">
          Se algo aqui fizer sentido, chame o DGN Club no WhatsApp. A gente
          reserva uma janela específica pro seu carro e confirma a condição
          comercial vigente.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled
            title="Botão ilustrativo — página pública real chega na Entrega 2."
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 text-[13px] font-semibold text-[#E7C96A] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Falar com o DGN no WhatsApp
          </button>
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[13px] font-semibold text-white/70 disabled:opacity-60"
          >
            Não é para mim
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] text-white/35">
          Preview interno · sem tracking
        </p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IllustrativeHero({ brand, model, color }: { brand: string; model: string; color: string }) {
  return (
    <div
      className="flex h-40 items-end justify-start bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#050505] p-4"
      aria-hidden="true"
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/25">
        {brand} · {model} · {color}
      </div>
    </div>
  );
}

function MockPhoto({ caption, areaLabel }: { caption: string; areaLabel: string }) {
  return (
    <div className="relative flex h-24 min-w-[9rem] flex-col justify-end overflow-hidden rounded-lg border border-white/[0.06] bg-gradient-to-br from-[#161616] to-[#0a0a0a] px-2 pb-1.5">
      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/70">
        Foto · {areaLabel}
      </span>
      <span className="text-[9px] leading-tight text-white/65">{caption}</span>
    </div>
  );
}

function PriorityChip({ priority }: { priority: "opcional" | "recomendado" | "prioritario" }) {
  const map = {
    opcional:     { label: "Opcional",     cls: "border-white/10 bg-white/[0.03] text-white/60" },
    recomendado:  { label: "Recomendado",  cls: "border-[#C9A84C]/40 bg-[#C9A84C]/[0.08] text-[#E7C96A]" },
    prioritario:  { label: "Prioritário",  cls: "border-red-300/30 bg-red-300/[0.06] text-red-200" },
  } as const;
  const chip = map[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${chip.cls}`}
    >
      {chip.label}
    </span>
  );
}
