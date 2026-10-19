"use client";

import { usePresentation } from "./PresentationProvider";
import { SCENES } from "./scenes";

/**
 * Painel narrativo da apresentação.
 * Posicionamento: bottom-right em desktop, bottom full-width em mobile.
 * Em desktop, nunca cobre o conteúdo central (max-w controlado + canto direito).
 * No mobile, reserva padding-bottom no body para evitar oclusão.
 */
export function PresentationOverlay() {
  const { active, stepIndex, totalSteps, currentScene, next, prev, stop, goTo } =
    usePresentation();
  if (!active || !currentScene) return null;

  const isLast = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <>
      {/* Reserva de espaço no bottom pra o painel não cobrir conteúdo quando overlay fica fixo */}
      <style>{`
        html, body { scroll-padding-bottom: 280px; }
        @media (min-width: 1024px) {
          html, body { scroll-padding-bottom: 160px; }
        }
      `}</style>

      {/* Barra de progresso no topo */}
      <div className="fixed top-0 inset-x-0 h-[3px] bg-white/5 z-[60] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-gold-400 to-gold-300 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Dots indicando etapa */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1.5 pointer-events-auto bg-ink-900/80 backdrop-blur-md border border-white/5 rounded-full px-3 py-2 shadow-glass">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Ir para etapa ${i + 1}: ${s.title}`}
            className={`transition-all rounded-full ${
              i === stepIndex
                ? "w-6 h-1.5 bg-gold-400"
                : i < stepIndex
                ? "w-1.5 h-1.5 bg-gold-400/50 hover:bg-gold-400"
                : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30"
            }`}
          />
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-300 font-mono">
          {stepIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* Painel narrativo — canto direito em desktop, bottom em mobile */}
      <div className="fixed bottom-4 right-4 left-4 lg:left-auto lg:right-6 lg:bottom-6 lg:max-w-[420px] z-[60] pointer-events-auto">
        <div className="relative rounded-2xl border border-gold-400/25 bg-ink-900/95 backdrop-blur-md shadow-glass overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20 shrink-0">
                  Apresentação
                </span>
                <span className="text-[11px] uppercase tracking-wider text-ink-400 shrink-0">
                  {stepIndex + 1} / {totalSteps}
                </span>
              </div>
              <button
                onClick={stop}
                className="btn-subtle shrink-0 text-xs"
                aria-label="Encerrar apresentação"
              >
                Encerrar · <span className="kbd">Esc</span>
              </button>
            </div>

            <h3 className="mt-3 text-[18px] font-semibold text-white tracking-tight leading-snug">
              {currentScene.title}
            </h3>
            <p className="mt-1.5 text-[13px] text-ink-200 leading-relaxed">
              {currentScene.caption}
            </p>
            <p className="mt-2 text-[12px] text-gold-300 font-medium leading-snug">
              → {currentScene.takeaway}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-ink-400">
                <span className="kbd">←</span>
                <span className="kbd">→</span>
                <span>navegar</span>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <button
                  onClick={prev}
                  disabled={stepIndex === 0}
                  className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed flex-1 lg:flex-initial"
                >
                  Voltar
                </button>
                <button
                  onClick={isLast ? stop : next}
                  className="btn-primary flex-1 lg:flex-initial"
                >
                  {isLast ? "Encerrar" : "Avançar"}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
