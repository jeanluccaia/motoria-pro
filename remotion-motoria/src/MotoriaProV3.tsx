import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG     = "#0a0a0a";
const CARD   = "#161616";
const CARD2  = "#1c1c1e";
const BORDER = "rgba(255,255,255,0.07)";
const GREEN  = "#22c55e";
const GREEN2 = "rgba(34,197,94,0.12)";
const GREEN3 = "rgba(34,197,94,0.06)";
const RED    = "#ef4444";
const AMBER  = "#f59e0b";
const T1     = "#f4f4f5";
const T2     = "rgba(244,244,245,0.55)";
const T3     = "rgba(244,244,245,0.3)";
const FONT   = '"Inter","SF Pro Display",-apple-system,system-ui,sans-serif';
const MONO   = '"JetBrains Mono","Courier New",monospace';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const fi = (
  frame: number,
  from: number,
  to: number,
  dur = 18,
  easing?: (t: number) => number
) =>
  clamp(
    interpolate(frame, [from, from + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easing ?? Easing.out(Easing.cubic),
    }),
    0,
    1
  );

const slideIn = (frame: number, start: number, dur = 20, dy = 40) => {
  const p = fi(frame, start, start + dur, dur);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * dy}px)`,
  };
};

// ─── Timing (frames @ 30fps) ──────────────────────────────────────────────────
//  Scene 1:  0-90    (0-3s)   Hook
//  Scene 2:  90-240  (3-8s)   Bilhete múltipla
//  Scene 3:  240-360 (8-12s)  Loading
//  Scene 4:  360-510 (12-17s) Paywall preview
//  Scene 5:  510-750 (17-25s) Bankroll
//  Scene 6:  750-900 (25-30s) CTA final

// ─── Root composition ─────────────────────────────────────────────────────────
export const MotoriaProV3: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFade = interpolate(frame, [880, 900], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, opacity: globalFade }}>
      <Sequence from={0} durationInFrames={90}>
        <SceneHook />
      </Sequence>
      <Sequence from={90} durationInFrames={150}>
        <SceneBilhete />
      </Sequence>
      <Sequence from={240} durationInFrames={120}>
        <SceneLoading />
      </Sequence>
      <Sequence from={360} durationInFrames={150}>
        <ScenePaywall />
      </Sequence>
      <Sequence from={510} durationInFrames={240}>
        <SceneBankroll />
      </Sequence>
      <Sequence from={750} durationInFrames={150}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — HOOK (0–3s, frames 0–90)
// ─────────────────────────────────────────────────────────────────────────────
const SceneHook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowPulse = 0.6 + 0.4 * Math.sin((f / fps) * Math.PI * 2);

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        overflow: "hidden",
      }}
    >
      {/* Green ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(34,197,94,${0.06 * glowPulse}) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Logo chip */}
      <div
        style={{
          ...slideIn(f, 0, 20),
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: GREEN2,
          border: `1px solid rgba(34,197,94,0.28)`,
          borderRadius: 99,
          padding: "10px 28px",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: GREEN,
            boxShadow: `0 0 10px ${GREEN}`,
          }}
        />
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: GREEN,
            fontFamily: MONO,
          }}
        >
          MOTORIA PRO
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          ...slideIn(f, 12, 22),
          textAlign: "center",
          padding: "0 80px",
          lineHeight: 1.0,
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            color: T1,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
          }}
        >
          Vai
          <br />
          apostar?
        </div>
      </div>

      {/* Sub-headline */}
      <div style={{ ...slideIn(f, 26, 22), textAlign: "center" }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: GREEN,
            letterSpacing: "-0.02em",
          }}
        >
          Analise antes.
        </div>
      </div>

      {/* Caption */}
      <div style={{ ...slideIn(f, 42, 20), textAlign: "center", padding: "0 120px" }}>
        <div
          style={{
            fontSize: 38,
            fontWeight: 400,
            color: T3,
            lineHeight: 1.5,
          }}
        >
          Veja o risco da aposta antes de colocar o dinheiro.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — BILHETE MÚLTIPLA (3–8s, frames 90–240, local 0–150)
// ─────────────────────────────────────────────────────────────────────────────
const SELECOES = [
  { jogo: "Flamengo vence", mercado: "Resultado da partida", odd: 1.82 },
  { jogo: "Mais de 2.5 gols", mercado: "Over/Under", odd: 1.74 },
  { jogo: "Ambos marcam", mercado: "BTTS", odd: 1.91 },
];

const SceneBilhete: React.FC = () => {
  const f = useCurrentFrame();

  const oddTotal = SELECOES.reduce((a, s) => a * s.odd, 1).toFixed(2);
  const chance   = ((1 / parseFloat(oddTotal)) * 100).toFixed(1);

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 70px",
        gap: 0,
      }}
    >
      {/* Title */}
      <div style={{ ...slideIn(f, 0, 18), marginBottom: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: T3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Monte sua aposta
        </div>
        <div style={{ fontSize: 60, fontWeight: 900, color: T1, letterSpacing: "-0.02em", marginTop: 6 }}>
          ou múltipla.
        </div>
      </div>

      {/* Selection cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        {SELECOES.map((s, i) => {
          const appear = fi(f, 10 + i * 18, 10 + i * 18 + 22, 22);
          return (
            <div
              key={i}
              style={{
                opacity: appear,
                transform: `translateX(${(1 - appear) * -60}px)`,
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 18,
                padding: "32px 40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 44, fontWeight: 800, color: T1, letterSpacing: "-0.01em" }}>
                  {s.jogo}
                </div>
                <div style={{ fontSize: 30, color: T3, marginTop: 6 }}>{s.mercado}</div>
              </div>
              <div
                style={{
                  background: GREEN2,
                  border: `1px solid rgba(34,197,94,0.3)`,
                  borderRadius: 12,
                  padding: "12px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 14, color: T3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>ODD</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: GREEN, fontFamily: MONO }}>
                  {s.odd.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      {f >= 70 && (
        <div
          style={{
            ...slideIn(f, 70, 18),
            marginTop: 32,
            width: "100%",
            background: CARD2,
            border: `1px solid rgba(34,197,94,0.2)`,
            borderRadius: 18,
            padding: "28px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 28, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Odd Total</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: AMBER, fontFamily: MONO, lineHeight: 1 }}>
              {oddTotal}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Chance real</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: RED, fontFamily: MONO, lineHeight: 1 }}>
              {chance}%
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Entrada</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: T1, fontFamily: MONO, lineHeight: 1 }}>
              R$50
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — LOADING (8–12s, frames 240–360, local 0–120)
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  "Analisando risco da entrada…",
  "Calculando risco do bilhete completo…",
  "Verificando exposição da banca…",
  "Identificando sinais de cautela…",
];

const SceneLoading: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progressPct = clamp(interpolate(f, [0, 100], [0, 100]), 0, 100);
  const pulseScale = 1 + 0.03 * Math.sin((f / fps) * Math.PI * 3);

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: 0,
      }}
    >
      {/* Logo dot pulsing */}
      <div
        style={{
          ...slideIn(f, 0, 14),
          transform: `scale(${pulseScale})`,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: GREEN2,
          border: `2px solid rgba(34,197,94,0.4)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          boxShadow: `0 0 40px rgba(34,197,94,0.2)`,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: GREEN,
            boxShadow: `0 0 20px ${GREEN}`,
          }}
        />
      </div>

      {/* Title */}
      <div style={{ ...slideIn(f, 4, 18), textAlign: "center", marginBottom: 60 }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: T1, letterSpacing: "-0.02em" }}>
          Analisando bilhete
        </div>
        <div style={{ fontSize: 34, color: T3, marginTop: 8 }}>MotorIA Risk Engine™</div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          ...slideIn(f, 8, 16),
          width: "100%",
          marginBottom: 52,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 6,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${GREEN}, rgba(34,197,94,0.6))`,
              borderRadius: 99,
              transition: "width 0.1s linear",
              boxShadow: `0 0 12px ${GREEN}`,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 12,
            textAlign: "right",
            fontSize: 28,
            color: GREEN,
            fontFamily: MONO,
          }}
        >
          {Math.round(progressPct)}%
        </div>
      </div>

      {/* Step list */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
        {STEPS.map((step, i) => {
          const stepStart = 10 + i * 22;
          const stepOpacity = fi(f, stepStart, stepStart + 16, 16);
          const done = f > stepStart + 26;

          return (
            <div
              key={i}
              style={{
                opacity: stepOpacity,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: done ? GREEN : "rgba(255,255,255,0.08)",
                  border: done ? "none" : `1px solid rgba(255,255,255,0.15)`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                }}
              >
                {done && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div
                style={{
                  fontSize: 38,
                  color: done ? T1 : T3,
                  fontWeight: done ? 600 : 400,
                }}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 — PAYWALL PREVIEW (12–17s, frames 360–510, local 0–150)
// ─────────────────────────────────────────────────────────────────────────────
const SIGNALS = [
  "Risco acumulado detectado",
  "Bilhete com múltiplas dependências",
  "Exposição relevante na banca",
];

const BlurredValue: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: "24px 36px",
      flex: 1,
    }}
  >
    <div style={{ fontSize: 26, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
      {label}
    </div>
    <div
      style={{
        fontSize: 58,
        fontWeight: 900,
        fontFamily: MONO,
        color: T1,
        filter: "blur(12px)",
        userSelect: "none",
      }}
    >
      {value}
    </div>
  </div>
);

const ScenePaywall: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 70px",
        gap: 0,
      }}
    >
      {/* Alert header */}
      <div
        style={{
          ...slideIn(f, 0, 18),
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: AMBER,
            boxShadow: `0 0 10px ${AMBER}`,
          }}
        />
        <div style={{ fontSize: 34, fontWeight: 700, color: AMBER }}>Risco identificado no bilhete</div>
      </div>

      {/* Signal chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", marginBottom: 36 }}>
        {SIGNALS.map((s, i) => (
          <div
            key={i}
            style={{
              ...slideIn(f, 8 + i * 12, 16),
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 12,
              padding: "20px 32px",
              fontSize: 36,
              color: "#fde68a",
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Blurred metrics */}
      <div
        style={{
          ...slideIn(f, 42, 18),
          display: "flex",
          gap: 20,
          width: "100%",
          marginBottom: 36,
        }}
      >
        <BlurredValue label="Risco do bilhete" value="74/100" />
        <BlurredValue label="Exposição" value="11%" />
      </div>

      {/* Lock box */}
      <div
        style={{
          ...slideIn(f, 60, 20),
          width: "100%",
          background: CARD,
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 22,
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Lock icon */}
        <div style={{ fontSize: 56 }}>🔒</div>

        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: T1,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          Desbloqueie a análise completa
        </div>

        <div
          style={{
            background: GREEN,
            borderRadius: 14,
            padding: "22px 0",
            width: "100%",
            textAlign: "center",
            fontSize: 40,
            fontWeight: 900,
            color: "#000",
            letterSpacing: "-0.01em",
          }}
        >
          Desbloquear por R$27
        </div>

        <div style={{ fontSize: 28, color: T3 }}>
          Pagamento único · sem mensalidade · acesso imediato
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 5 — BANKROLL (17–25s, frames 510–750, local 0–240)
// ─────────────────────────────────────────────────────────────────────────────
const BIG_METRICS = [
  { label: "Saldo atual",      value: "R$ 1.247", color: T1,    sub: "banca atual" },
  { label: "Lucro do mês",     value: "+R$ 247",  color: GREEN,  sub: "+24,7% no mês" },
];

const SMALL_METRICS = [
  { label: "ROI",                  value: "+12,4%", color: GREEN },
  { label: "Seq. de perdas",       value: "1",      color: T1    },
  { label: "Em risco agora",       value: "4%",     color: AMBER },
];

const HISTORY = [
  { label: "Fl. × Palm. — Res. da partida", valor: "R$50", resultado: "+R$ 41", cor: GREEN },
  { label: "Bayern × Arsenal — +2.5 gols",  valor: "R$30", resultado: "-R$ 30", cor: RED   },
  { label: "Man City × Liverpool — BTTS",   valor: "R$40", resultado: "+R$ 36", cor: GREEN },
];

const MetricCard: React.FC<{
  label: string; value: string; color: string; sub?: string;
  opacity: number; tx: number;
}> = ({ label, value, color, sub, opacity, tx }) => (
  <div
    style={{
      opacity,
      transform: `translateY(${tx}px)`,
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 20,
      padding: "36px 44px",
      flex: 1,
    }}
  >
    <div
      style={{
        fontSize: 28,
        color: T3,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 72,
        fontWeight: 900,
        color,
        fontFamily: MONO,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 26, color: T3, marginTop: 8 }}>{sub}</div>
    )}
  </div>
);

const SceneBankroll: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        padding: "80px 70px 60px",
        gap: 0,
      }}
    >
      {/* Header */}
      <div style={{ ...slideIn(f, 0, 18), marginBottom: 40 }}>
        <div style={{ fontSize: 34, color: T3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Controle de banca
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: T1, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Controle sua banca no mês.
        </div>
      </div>

      {/* Big metrics row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        {BIG_METRICS.map((m, i) => {
          const p = fi(f, 12 + i * 14, 12 + i * 14 + 20, 20);
          return (
            <MetricCard
              key={i}
              label={m.label}
              value={m.value}
              color={m.color}
              sub={m.sub}
              opacity={p}
              tx={(1 - p) * 32}
            />
          );
        })}
      </div>

      {/* Small metrics row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
        {SMALL_METRICS.map((m, i) => {
          const p = fi(f, 28 + i * 10, 28 + i * 10 + 18, 18);
          return (
            <div
              key={i}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 24}px)`,
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "24px 32px",
                flex: 1,
              }}
            >
              <div style={{ fontSize: 24, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: m.color, fontFamily: MONO, lineHeight: 1 }}>
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* History label */}
      <div style={{ ...slideIn(f, 62, 16), marginBottom: 16 }}>
        <div style={{ fontSize: 28, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Últimas entradas
        </div>
      </div>

      {/* History rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {HISTORY.map((h, i) => {
          const p = fi(f, 68 + i * 12, 68 + i * 12 + 18, 18);
          return (
            <div
              key={i}
              style={{
                opacity: p,
                transform: `translateX(${(1 - p) * -30}px)`,
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 14,
                padding: "22px 32px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 30, fontWeight: 600, color: T1 }}>{h.label}</div>
                <div style={{ fontSize: 24, color: T3, marginTop: 4 }}>Entrada: {h.valor}</div>
              </div>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: h.cor,
                  fontFamily: MONO,
                }}
              >
                {h.resultado}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 6 — CTA FINAL (25–30s, frames 750–900, local 0–150)
// ─────────────────────────────────────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowPulse = 0.6 + 0.4 * Math.sin((f / fps) * Math.PI * 1.5);

  const scalePop = spring({
    frame: f,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "50%",
          transform: "translate(-50%, 50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(34,197,94,${0.08 * glowPulse}) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: fi(f, 0, 20),
          transform: `scale(${scalePop})`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 56,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px rgba(34,197,94,0.4)`,
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 900, color: "#000", fontFamily: MONO }}>M</span>
        </div>
        <div>
          <div style={{ fontSize: 52, fontWeight: 900, color: T1, letterSpacing: "0.06em", fontFamily: MONO }}>
            MOTORIA PRO
          </div>
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          ...slideIn(f, 14, 22),
          textAlign: "center",
          marginBottom: 56,
          lineHeight: 1.15,
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 900, color: T1, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Analise o risco.
          <br />
          <span style={{ color: GREEN }}>Controle sua banca.</span>
          <br />
          Antes de apostar.
        </div>
      </div>

      {/* CTA button */}
      <div
        style={{
          ...slideIn(f, 30, 20),
          width: "100%",
          background: GREEN,
          borderRadius: 20,
          padding: "38px 0",
          textAlign: "center",
          marginBottom: 28,
          boxShadow: `0 0 60px rgba(34,197,94,0.25)`,
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 900, color: "#000", letterSpacing: "-0.01em" }}>
          Acesso por R$27
        </div>
      </div>

      {/* Microcopy */}
      <div style={{ ...slideIn(f, 44, 18), textAlign: "center" }}>
        <div style={{ fontSize: 34, color: T3 }}>
          Pagamento único · sem mensalidade · acesso imediato
        </div>
        <div style={{ fontSize: 28, color: T3, marginTop: 12 }}>
          7 dias de garantia · cancele se não gostar
        </div>
      </div>
    </AbsoluteFill>
  );
};
