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
const BG      = "#080808";
const CARD    = "#111113";
const CARD2   = "#17171a";
const BORDER  = "rgba(255,255,255,0.07)";
const GREEN   = "#22c55e";
const GREEN_G = "rgba(34,197,94,0.15)";
const RED     = "#ef4444";
const RED_G   = "rgba(239,68,68,0.12)";
const AMBER   = "#f59e0b";
const AMBER_G = "rgba(245,158,11,0.12)";
const T1      = "#f8f8f8";
const T2      = "rgba(248,248,248,0.5)";
const T3      = "rgba(248,248,248,0.25)";
const FONT    = '"Inter","SF Pro Display",-apple-system,system-ui,sans-serif';
const MONO    = '"JetBrains Mono","Courier New",monospace';

// ─── Animation helpers ────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function sp(frame: number, start: number, cfg = { damping: 14, stiffness: 120, mass: 1 }) {
  return spring({ frame: frame - start, fps: 30, config: cfg, from: 0, to: 1 });
}

function fi(frame: number, start: number, dur: number, ease = Easing.out(Easing.cubic)) {
  return clamp(interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  }), 0, 1);
}

// Slide up + fade
function su(frame: number, start: number, dur = 22, dy = 48) {
  const p = fi(frame, start, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` };
}

// Slide from left
function sl(frame: number, start: number, dur = 22, dx = -60) {
  const p = fi(frame, start, dur);
  return { opacity: p, transform: `translateX(${(1 - p) * dx}px)` };
}

// Spring scale-in
function sc(frame: number, start: number) {
  const p = sp(frame, start, { damping: 12, stiffness: 140, mass: 0.8 });
  return { opacity: clamp(p * 2, 0, 1), transform: `scale(${0.7 + p * 0.3})` };
}

// Counter: animate a number from 0 to target
function counter(frame: number, start: number, dur: number, target: number, decimals = 0) {
  const p = fi(frame, start, dur, Easing.out(Easing.exp));
  return (p * target).toFixed(decimals);
}

// ─── Timing ───────────────────────────────────────────────────────────────────
// Scene 1: Hook       0-90   (0-3s)
// Scene 2: Bilhete    90-240 (3-8s)
// Scene 3: Loading    240-360 (8-12s)
// Scene 4: Análise    360-570 (12-19s)  ← dinheiro: resultado COMPLETO e poderoso
// Scene 5: Banca      570-780 (19-26s)
// Scene 6: CTA        780-900 (26-30s)

export const MotoriaProV3: React.FC = () => {
  const frame = useCurrentFrame();
  const fade  = fi(frame, 880, 20, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: FONT, opacity: 1 - fade }}>
      <Sequence from={0}   durationInFrames={90}><SceneHook /></Sequence>
      <Sequence from={90}  durationInFrames={150}><SceneBilhete /></Sequence>
      <Sequence from={240} durationInFrames={120}><SceneLoading /></Sequence>
      <Sequence from={360} durationInFrames={210}><SceneAnalise /></Sequence>
      <Sequence from={570} durationInFrames={210}><SceneBanca /></Sequence>
      <Sequence from={780} durationInFrames={120}><SceneCTA /></Sequence>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — HOOK (0-3s)
// Grande, cinematográfico, emocional
// ─────────────────────────────────────────────────────────────────────────────
const SceneHook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 1.2);
  const glowSize = 600 + pulse * 120;

  // Parallax zoom
  const zoom = interpolate(f, [0, 90], [1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {/* Atmospheric glow */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: `translate(-50%, -50%) scale(${zoom})`,
        width: glowSize, height: glowSize, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(34,197,94,${0.13 * pulse}) 0%, transparent 68%)`,
        pointerEvents: "none",
      }} />
      {/* Second glow ring */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900, height: 900, borderRadius: "50%",
        border: `1px solid rgba(34,197,94,${0.06 * pulse})`,
        pointerEvents: "none",
      }} />

      <AbsoluteFill style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 80px", gap: 0,
        transform: `scale(${zoom})`,
      }}>
        {/* Chip */}
        <div style={{
          ...su(f, 0, 18, 30),
          display: "flex", alignItems: "center", gap: 12,
          background: GREEN_G, border: `1px solid rgba(34,197,94,0.3)`,
          borderRadius: 99, padding: "10px 30px", marginBottom: 48,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%", background: GREEN,
            boxShadow: `0 0 12px ${GREEN}, 0 0 24px rgba(34,197,94,0.4)`,
          }} />
          <span style={{
            fontSize: 28, fontWeight: 700, letterSpacing: "0.16em",
            color: GREEN, fontFamily: MONO,
          }}>MOTORIA PRO</span>
        </div>

        {/* Main headline — enormous */}
        <div style={{ ...su(f, 8, 20), textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 140, fontWeight: 900, color: T1,
            letterSpacing: "-0.05em", lineHeight: 0.92,
          }}>
            Vai<br />
            <span style={{ color: GREEN }}>apostar?</span>
          </div>
        </div>

        {/* Sub — com peso */}
        <div style={{ ...su(f, 20, 20), textAlign: "center", marginBottom: 44 }}>
          <div style={{
            fontSize: 54, fontWeight: 700, color: T2,
            letterSpacing: "-0.02em", lineHeight: 1.2,
          }}>
            Analise o risco antes.
          </div>
        </div>

        {/* Micro copy */}
        <div style={{ ...su(f, 34, 18) }}>
          <div style={{
            fontSize: 34, fontWeight: 400, color: T3,
            textAlign: "center",
          }}>
            Odd, chance real, impacto na banca — em segundos.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — BILHETE MÚLTIPLA (3-8s, local 0-150)
// ─────────────────────────────────────────────────────────────────────────────
const SELS = [
  { jogo: "Flamengo vence",   mercado: "Resultado final",    odd: 1.82 },
  { jogo: "Mais de 2.5 gols", mercado: "Over / Under",       odd: 1.74 },
  { jogo: "Ambos marcam",     mercado: "BTTS",               odd: 1.91 },
];
const ODD_TOTAL  = SELS.reduce((a, s) => a * s.odd, 1);
const CHANCE_PCT = (1 / ODD_TOTAL) * 100;

const SceneBilhete: React.FC = () => {
  const f = useCurrentFrame();

  const oddStr    = counter(f, 90, 30, ODD_TOTAL, 2);
  const chanceStr = counter(f, 90, 30, CHANCE_PCT, 1);

  return (
    <AbsoluteFill style={{
      background: BG, display: "flex", flexDirection: "column",
      alignItems: "stretch", justifyContent: "center",
      padding: "60px 72px", gap: 0,
    }}>
      {/* Section label */}
      <div style={{ ...su(f, 0, 16, 20), marginBottom: 32 }}>
        <div style={{ fontSize: 26, color: T3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Aposta múltipla
        </div>
        <div style={{ fontSize: 66, fontWeight: 900, color: T1, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Monte seu bilhete.
        </div>
      </div>

      {/* Cards de seleção */}
      {SELS.map((s, i) => {
        const pSpring = sp(f, 14 + i * 20, { damping: 16, stiffness: 130, mass: 1 });
        return (
          <div key={i} style={{
            opacity: clamp(pSpring * 2, 0, 1),
            transform: `translateX(${(1 - pSpring) * -80}px)`,
            marginBottom: 18,
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 20, padding: "30px 36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}>
            {/* Number badge */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: GREEN_G, border: `1px solid rgba(34,197,94,0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: MONO,
              flexShrink: 0, marginRight: 28,
            }}>{i + 1}</div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: T1, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                {s.jogo}
              </div>
              <div style={{ fontSize: 26, color: T3, marginTop: 4 }}>{s.mercado}</div>
            </div>

            {/* Odd */}
            <div style={{
              background: GREEN_G, border: `1px solid rgba(34,197,94,0.25)`,
              borderRadius: 14, padding: "14px 24px", textAlign: "center", flexShrink: 0,
            }}>
              <div style={{ fontSize: 13, color: T3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>ODD</div>
              <div style={{ fontSize: 46, fontWeight: 900, color: GREEN, fontFamily: MONO, lineHeight: 1 }}>
                {s.odd.toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Barra de totais */}
      {f >= 80 && (
        <div style={{
          ...su(f, 80, 18),
          marginTop: 8,
          background: `linear-gradient(135deg, ${CARD2} 0%, rgba(34,197,94,0.06) 100%)`,
          border: `1px solid rgba(34,197,94,0.2)`,
          borderRadius: 20, padding: "28px 36px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Odd Total</div>
            <div style={{ fontSize: 76, fontWeight: 900, color: AMBER, fontFamily: MONO, lineHeight: 1 }}>
              {oddStr}×
            </div>
          </div>
          <div style={{ width: 1, height: 60, background: BORDER }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Chance real</div>
            <div style={{ fontSize: 76, fontWeight: 900, color: RED, fontFamily: MONO, lineHeight: 1 }}>
              {chanceStr}%
            </div>
          </div>
          <div style={{ width: 1, height: 60, background: BORDER }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, color: T3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Entrada</div>
            <div style={{ fontSize: 76, fontWeight: 900, color: T1, fontFamily: MONO, lineHeight: 1 }}>
              R$50
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — LOADING premium (8-12s, local 0-120)
// ─────────────────────────────────────────────────────────────────────────────
const LOAD_STEPS = [
  "Analisando odd e chance real…",
  "Calculando risco combinado…",
  "Verificando exposição da banca…",
  "Identificando sinais de cautela…",
];

const SceneLoading: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pct     = clamp(interpolate(f, [0, 108], [0, 100]), 0, 100);
  const pulse1  = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 2.4);
  const pulse2  = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 2.4 + 1.2);
  const rotDeg  = interpolate(f, [0, 120], [0, 360]);

  return (
    <AbsoluteFill style={{
      background: BG, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 80px", gap: 0, overflow: "hidden",
    }}>
      {/* Anéis concêntricos pulsando */}
      {[340, 240, 160].map((size, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "36%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: size, height: size, borderRadius: "50%",
          border: `1px solid rgba(34,197,94,${(0.06 - i * 0.015) * (i === 0 ? pulse1 : pulse2)})`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Ícone central rotacionando */}
      <div style={{ ...sc(f, 0), marginBottom: 48, position: "relative" }}>
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: GREEN_G, border: `2px solid rgba(34,197,94,${0.3 + 0.2 * pulse1})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${40 + 20 * pulse1}px rgba(34,197,94,${0.2 + 0.1 * pulse1})`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: GREEN,
            boxShadow: `0 0 20px ${GREEN}`,
          }} />
        </div>
        {/* Arco rotacionando */}
        <svg style={{
          position: "absolute", top: -6, left: -6,
          transform: `rotate(${rotDeg}deg)`,
        }} width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="52"
            fill="none" stroke={GREEN} strokeWidth="2"
            strokeDasharray="60 400" strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Título */}
      <div style={{ ...su(f, 6, 18), textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 58, fontWeight: 900, color: T1, letterSpacing: "-0.025em" }}>
          Analisando bilhete
        </div>
        <div style={{ fontSize: 30, color: GREEN, fontFamily: MONO, marginTop: 6 }}>
          MotorIA Risk Engine™
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ ...su(f, 10, 14), width: "100%", marginBottom: 52 }}>
        <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: `linear-gradient(90deg, ${GREEN} 0%, rgba(34,197,94,0.5) 100%)`,
            borderRadius: 99,
            boxShadow: `0 0 12px ${GREEN}, 0 0 4px ${GREEN}`,
            transition: "width 0.05s linear",
          }} />
        </div>
        <div style={{ marginTop: 10, textAlign: "right", fontSize: 24, color: GREEN, fontFamily: MONO }}>
          {Math.round(pct)}%
        </div>
      </div>

      {/* Steps */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
        {LOAD_STEPS.map((step, i) => {
          const p     = fi(f, 8 + i * 24, 16);
          const done  = f > 14 + i * 24 + 20;
          return (
            <div key={i} style={{ opacity: p, display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: done ? GREEN : "rgba(255,255,255,0.06)",
                border: done ? "none" : "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
                boxShadow: done ? `0 0 12px rgba(34,197,94,0.4)` : "none",
              }}>
                {done && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9l4 4L14.5 5.5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 36, color: done ? T1 : T3, fontWeight: done ? 600 : 400 }}>
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
// SCENE 4 — ANÁLISE (resultado completo — hero moment)
// ─────────────────────────────────────────────────────────────────────────────
const SceneAnalise: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 1.8);
  const ctaSp  = sp(f, 55, { damping: 12, stiffness: 120, mass: 1 });

  const SIGNALS = [
    "Odd com variação atípica detectada",
    "Exposição acima do limite seguro",
    "Inconsistência estatística no mercado",
  ];

  return (
    <AbsoluteFill style={{
      background: BG, display: "flex", flexDirection: "column",
      alignItems: "center", padding: "56px 70px", gap: 0, overflow: "hidden",
    }}>
      {/* Glow vermelho fundo */}
      <div style={{
        position: "absolute", top: "35%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 720, height: 720, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(239,68,68,${0.09 * pulse}) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ ...su(f, 0, 18), width: "100%", marginBottom: 28 }}>
        <div style={{ fontSize: 26, color: T3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Resultado da análise
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: T1, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Risco identificado<br />
          <span style={{ color: RED }}>no bilhete.</span>
        </div>
      </div>

      {/* Badge EXIGE CAUTELA */}
      {(() => {
        const p = sp(f, 8, { damping: 14, stiffness: 130, mass: 1 });
        return (
          <div style={{
            opacity: clamp(p * 2, 0, 1),
            transform: `scale(${0.85 + p * 0.15})`,
            width: "100%", marginBottom: 20,
            background: "rgba(239,68,68,0.12)",
            border: `2px solid rgba(239,68,68,${0.4 + 0.2 * pulse})`,
            borderRadius: 14, padding: "16px 24px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: `0 0 ${20 + 10 * pulse}px rgba(239,68,68,${0.15 * pulse})`,
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: RED, flexShrink: 0,
              boxShadow: `0 0 ${8 + 4 * pulse}px ${RED}`,
            }} />
            <span style={{ fontSize: 30, fontWeight: 900, color: RED, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              EXIGE CAUTELA
            </span>
          </div>
        );
      })()}

      {/* Cards com dados visíveis */}
      <div style={{ display: "flex", gap: 16, width: "100%", marginBottom: 18 }}>
        {[
          { label: "Risco do bilhete", value: "73/100",  color: RED,   bg: RED_G,   border: "rgba(239,68,68,0.28)" },
          { label: "Chance real",       value: "32,4%",   color: AMBER, bg: AMBER_G, border: "rgba(245,158,11,0.28)" },
        ].map((m, i) => {
          const p = sp(f, 14 + i * 12, { damping: 15, stiffness: 120, mass: 1 });
          return (
            <div key={i} style={{
              opacity: clamp(p * 2, 0, 1),
              transform: `translateY(${(1 - p) * 28}px)`,
              flex: 1, background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 18, padding: "22px 24px", position: "relative",
            }}>
              <div style={{ fontSize: 20, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                {m.label}
              </div>
              <div style={{
                fontSize: 54, fontWeight: 900, color: m.color, fontFamily: MONO, lineHeight: 1,
              }}>
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card leitura IA — visível */}
      <div style={{
        ...su(f, 28, 18),
        width: "100%", background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 18, padding: "22px 28px", marginBottom: 18, position: "relative",
      }}>
        <div style={{ fontSize: 20, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Leitura IA
        </div>
        <div style={{
          fontSize: 32, fontWeight: 800, color: T1, lineHeight: 1.35,
        }}>
          Alta exposição ao risco de perda
        </div>
        <div style={{
          fontSize: 24, fontWeight: 600, color: AMBER, marginTop: 8,
        }}>
          Odd supervalorizada · mercado instável
        </div>
      </div>

      {/* Sinais de alerta */}
      <div style={{ width: "100%", marginBottom: 22 }}>
        {SIGNALS.map((sig, i) => {
          const p = sp(f, 32 + i * 10, { damping: 16, stiffness: 120, mass: 1 });
          return (
            <div key={i} style={{
              opacity: clamp(p * 2, 0, 1),
              transform: `translateX(${(1 - p) * -30}px)`,
              display: "flex", alignItems: "center", gap: 14,
              marginBottom: i < SIGNALS.length - 1 ? 10 : 0,
              background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)",
              borderRadius: 12, padding: "12px 18px",
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: "50%", background: AMBER, flexShrink: 0,
                boxShadow: `0 0 8px ${AMBER}`,
              }} />
              <span style={{ fontSize: 24, color: AMBER, fontWeight: 600 }}>{sig}</span>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{
        opacity: clamp(ctaSp * 2, 0, 1),
        transform: `scale(${0.88 + ctaSp * 0.12})`,
        width: "100%",
        background: GREEN, borderRadius: 18,
        padding: "30px 0", textAlign: "center",
        boxShadow: `0 0 ${48 + 20 * pulse}px rgba(34,197,94,${0.28 + 0.12 * pulse})`,
      }}>
        <div style={{ fontSize: 38, fontWeight: 900, color: "#000", letterSpacing: "-0.01em" }}>
          Analisar meu bilhete agora
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 5 — BANCA (19-26s, local 0-210)
// ─────────────────────────────────────────────────────────────────────────────
const SceneBanca: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const saldo   = parseFloat(counter(f, 8,  55, 1247, 0));
  const lucro   = parseFloat(counter(f, 12, 55, 247, 0));
  const roi     = parseFloat(counter(f, 14, 55, 12.4, 1));
  const seqPerd = parseInt(counter(f, 16, 40, 3));

  const pulse = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 1.6);

  const HIST = [
    { jogo: "Flamengo × Palmeiras", tipo: "Resultado",  stake: "R$50", pl: "+R$ 41", cor: GREEN, bg: GREEN_G, bd: "rgba(34,197,94,0.2)"  },
    { jogo: "Bayern × Arsenal",      tipo: "Over 2.5",  stake: "R$30", pl: "-R$ 30", cor: RED,   bg: RED_G,   bd: "rgba(239,68,68,0.2)"   },
    { jogo: "Man City × Liverpool",  tipo: "BTTS",       stake: "R$40", pl: "+R$ 36", cor: GREEN, bg: GREEN_G, bd: "rgba(34,197,94,0.2)"   },
  ];

  return (
    <AbsoluteFill style={{
      background: BG, display: "flex", flexDirection: "column",
      padding: "52px 70px 44px", gap: 0, overflow: "hidden",
    }}>
      {/* Glow verde fundo */}
      <div style={{
        position: "absolute", top: "25%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(34,197,94,${0.06 * pulse}) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ ...su(f, 0, 18), marginBottom: 28 }}>
        <div style={{ fontSize: 26, color: T3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Controle de banca
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: T1, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Sabe onde está<br />
          <span style={{ color: GREEN }}>sua banca?</span>
        </div>
      </div>

      {/* Saldo atual — card hero */}
      {(() => {
        const p = sp(f, 8, { damping: 14, stiffness: 100, mass: 1 });
        return (
          <div style={{
            opacity: clamp(p * 2, 0, 1),
            transform: `translateY(${(1 - p) * 36}px)`,
            width: "100%", background: CARD,
            border: `2px solid rgba(34,197,94,0.3)`,
            borderRadius: 22, padding: "34px 40px", marginBottom: 18,
            boxShadow: `0 0 ${32 + 16 * pulse}px rgba(34,197,94,${0.08 * pulse})`,
          }}>
            <div style={{ fontSize: 22, color: T3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Saldo atual
            </div>
            <div style={{
              fontSize: 90, fontWeight: 900, color: T1, fontFamily: MONO,
              lineHeight: 1, letterSpacing: "-0.04em",
            }}>
              R$ {saldo.toLocaleString("pt-BR")}
            </div>
          </div>
        );
      })()}

      {/* Lucro + ROI lado a lado */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Lucro do mês",  val: `+R$ ${lucro}`,          color: GREEN, bg: GREEN_G, border: "rgba(34,197,94,0.28)", fontSize: 68 },
          { label: "ROI",           val: `+${roi.toFixed(1)}%`,   color: GREEN, bg: GREEN_G, border: "rgba(34,197,94,0.22)", fontSize: 68 },
        ].map((m, i) => {
          const p = sp(f, 20 + i * 14, { damping: 15, stiffness: 115, mass: 1 });
          return (
            <div key={i} style={{
              opacity: clamp(p * 2, 0, 1),
              transform: `translateY(${(1 - p) * 30}px)`,
              flex: 1, background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 20, padding: "26px 30px",
            }}>
              <div style={{ fontSize: 21, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                {m.label}
              </div>
              <div style={{ fontSize: m.fontSize, fontWeight: 900, color: m.color, fontFamily: MONO, lineHeight: 1 }}>
                {m.val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sequência de perdas + Em risco */}
      <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
        {[
          { label: "Seq. de perdas", val: `${seqPerd}×`, color: RED,   bg: RED_G,   border: "rgba(239,68,68,0.22)"  },
          { label: "Em risco",        val: "4%",          color: AMBER, bg: AMBER_G, border: "rgba(245,158,11,0.22)" },
        ].map((m, i) => {
          const p = sp(f, 34 + i * 12, { damping: 15, stiffness: 120, mass: 1 });
          return (
            <div key={i} style={{
              opacity: clamp(p * 2, 0, 1),
              transform: `translateY(${(1 - p) * 24}px)`,
              flex: 1, background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 18, padding: "22px 28px",
            }}>
              <div style={{ fontSize: 20, color: T3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 58, fontWeight: 900, color: m.color, fontFamily: MONO, lineHeight: 1 }}>
                {m.val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico */}
      <div style={{ ...su(f, 58, 14), marginBottom: 12 }}>
        <div style={{ fontSize: 22, color: T3, textTransform: "uppercase", letterSpacing: "0.1em" }}>Últimas entradas</div>
      </div>

      {HIST.map((h, i) => {
        const p = sp(f, 66 + i * 13, { damping: 16, stiffness: 130, mass: 1 });
        return (
          <div key={i} style={{
            opacity: clamp(p * 2, 0, 1),
            transform: `translateX(${(1 - p) * -40}px)`,
            marginBottom: i < HIST.length - 1 ? 10 : 0,
            background: h.bg, border: `1px solid ${h.bd}`,
            borderRadius: 14, padding: "18px 26px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T1 }}>{h.jogo}</div>
              <div style={{ fontSize: 20, color: T3, marginTop: 2 }}>{h.tipo} · {h.stake}</div>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: h.cor, fontFamily: MONO }}>
              {h.pl}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 6 — CTA FINAL (26-30s, local 0-120)
// ─────────────────────────────────────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse  = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 1.6);
  const logoSp = sp(f, 0, { damping: 10, stiffness: 120, mass: 0.9 });
  const btnSp  = sp(f, 30, { damping: 12, stiffness: 130, mass: 1 });

  return (
    <AbsoluteFill style={{
      background: BG, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 80px", overflow: "hidden",
    }}>
      {/* Glow central */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${700 + 80 * pulse}px`, height: `${700 + 80 * pulse}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(34,197,94,${0.1 * pulse}) 0%, transparent 65%)`,
        pointerEvents: "none",
      }} />

      {/* Logo mark */}
      <div style={{
        opacity: clamp(logoSp * 2, 0, 1),
        transform: `scale(${0.7 + logoSp * 0.3})`,
        display: "flex", alignItems: "center", gap: 18, marginBottom: 52,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: GREEN, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${40 + 20 * pulse}px rgba(34,197,94,${0.4 + 0.2 * pulse})`,
        }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: "#000", fontFamily: MONO }}>M</span>
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: T1, letterSpacing: "0.08em", fontFamily: MONO }}>
          MOTORIA PRO
        </div>
      </div>

      {/* Headline */}
      <div style={{ ...su(f, 12, 22), textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: T1, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Analise o risco.<br />
          <span style={{ color: GREEN }}>Controle sua banca.</span><br />
          Antes de apostar.
        </div>
      </div>

      {/* Sub */}
      <div style={{ ...su(f, 22, 18), textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 36, color: T3, lineHeight: 1.5 }}>
          Análise completa · Múltiplas · Controle de banca
        </div>
      </div>

      {/* CTA button */}
      <div style={{
        opacity: clamp(btnSp * 2, 0, 1),
        transform: `scale(${0.8 + btnSp * 0.2})`,
        width: "100%", marginBottom: 24,
        background: GREEN, borderRadius: 22,
        padding: "40px 0", textAlign: "center",
        boxShadow: `0 0 ${60 + 30 * pulse}px rgba(34,197,94,${0.3 + 0.15 * pulse})`,
      }}>
        <div style={{ fontSize: 50, fontWeight: 900, color: "#000", letterSpacing: "-0.02em" }}>
          Desbloquear por R$27
        </div>
      </div>

      {/* Microcopy */}
      <div style={{ ...su(f, 42, 16), textAlign: "center" }}>
        <div style={{ fontSize: 30, color: T3 }}>
          Pagamento único · sem mensalidade · 7 dias de garantia
        </div>
      </div>
    </AbsoluteFill>
  );
};
