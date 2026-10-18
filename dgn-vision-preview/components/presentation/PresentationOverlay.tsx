"use client";

import { usePresentation } from "./PresentationProvider";
import { SCENES } from "./scenes";

export function PresentationOverlay() {
  const { active, stepIndex, totalSteps, next, prev, stop, goTo } = usePresentation();
  if (!active) return null;

  const scene = SCENES[stepIndex];
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none">
      {/* Barra superior fina com progresso */}
      <div className="fixed top-0 inset-x-0 h-[3px] bg-white/5 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-gold-400 to-gold-300 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pontos de etapa no topo */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto bg-ink-900/80 backdrop-blur-md border border-white/5 rounded-full px-3 py-2 shadow-glass">
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

      {/* Painel inferior */}
      <div className="mx-auto max-w-3xl px-4 pb-6 pointer-events-auto">
        <div className="relative rounded-2xl border border-gold-400/20 bg-ink-900/90 backdrop-blur-md shadow-glass overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="pill bg-gold-400/10 text-gold-300 border border-gold-400/20">
                    Modo Apresentação
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-ink-400">
                    Etapa {stepIndex + 1} de {totalSteps}
                  </span>
                </div>
                <h3 className="mt-2 text-[22px] md:text-2xl font-semibold text-white tracking-tight leading-snug">
                  {scene.title}
                </h3>
                <p className="mt-2 text-[15px] text-ink-200 leading-relaxed">
                  {scene.caption}
                </p>
                <p className="mt-2 text-[13px] text-gold-300 font-medium">
                  → {scene.takeaway}
                </p>
              </div>
              <button
                onClick={stop}
                className="btn-subtle shrink-0"
                aria-label="Encerrar apresentação"
              >
                Encerrar · <span className="kbd">Esc</span>
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className="kbd">←</span>
                <span className="kbd">→</span>
                <span>navegar</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  disabled={stepIndex === 0}
                  className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>
                <button
                  onClick={next}
                  disabled={stepIndex === totalSteps - 1}
                  className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {stepIndex === totalSteps - 1 ? "Fim" : "Avançar"}
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
    </div>
  );
}
