import {
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from "remotion";
import { COLORS } from "../constants";
import { TexturaBrasilidade } from "./shared/TexturaBrasilidade";

interface Props {
  ctaText: string;
  oferta?: string;
}

// Botão CTA com micro-pulse único
const CtaButton: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - delay, fps, config: { damping: 24, stiffness: 140 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [20, 0]);

  // Pulse uma vez entre frame delay+15 e delay+30
  const pulseFrame = frame - (delay + 15);
  const pulse =
    pulseFrame >= 0 && pulseFrame <= 15
      ? interpolate(pulseFrame, [0, 7, 15], [1, 1.04, 1])
      : 1;

  return (
    <div style={{ opacity, transform: `translateY(${y}px) scale(${pulse})` }}>
      <div style={{
        background: COLORS.amarelo,
        borderRadius: 8,
        padding: "22px 56px",
        display: "inline-block",
        boxShadow: "0 8px 32px rgba(255,212,0,0.35)",
      }}>
        <span style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 44,
          color: COLORS.preto,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}>
          {text}
        </span>
      </div>
    </div>
  );
};

export const CtaCard: React.FC<Props> = ({
  ctaText,
  oferta = "Edição Copa 2026 · Tiragem limitada",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mkEnter = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 120 } });

  const e0 = mkEnter(0);
  const e1 = mkEnter(10);
  const e2 = mkEnter(22);
  const e3 = mkEnter(35);

  const slide = (e: number) => ({
    opacity: interpolate(e, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(e, [0, 1], [28, 0])}px)`,
  });

  return (
    <div style={{
      width: "100%", height: "100%",
      background: COLORS.preto,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", gap: 0,
    }}>
      <TexturaBrasilidade />

      {/* Logo */}
      <div style={{ ...slide(e0), marginBottom: 36, zIndex: 5, maxWidth: 280 }}>
        <Img src={staticFile("logo-pattamansa.webp")}
          style={{ width: "100%", objectFit: "contain" }} />
      </div>

      {/* Foto do produto */}
      <div style={{ ...slide(e1), marginBottom: 28, zIndex: 5, maxWidth: 420 }}>
        <Img src={staticFile("camisa-produto.webp")}
          style={{ width: "100%", maxHeight: 520, objectFit: "contain",
            filter: "drop-shadow(0 8px 32px rgba(31,168,76,0.25))" }} />
      </div>

      {/* Headline */}
      <div style={{ ...slide(e2), zIndex: 5, textAlign: "center", padding: "0 60px", marginBottom: 12 }}>
        <div style={{
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: 76, color: COLORS.offwhite,
          textTransform: "uppercase", lineHeight: 1.0,
          letterSpacing: "0.02em",
        }}>
          A CAMISA DO POVO
        </div>
        <div style={{
          fontFamily: "Archivo, sans-serif", fontWeight: 600,
          fontSize: 30, color: COLORS.amarelo,
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginTop: 8,
        }}>
          {oferta}
        </div>
        <div style={{
          fontFamily: "Archivo, sans-serif", fontWeight: 600,
          fontSize: 26, color: COLORS.verde,
          textTransform: "uppercase", letterSpacing: "0.12em",
          marginTop: 6, opacity: 0.85,
        }}>
          Estoque limitado
        </div>
      </div>

      {/* CTA Button */}
      <div style={{ zIndex: 5, marginTop: 16 }}>
        <CtaButton text={ctaText} delay={35} />
      </div>

      {/* Sub CTA */}
      <div style={{ ...slide(e3), zIndex: 5, marginTop: 18, textAlign: "center" }}>
        <span style={{
          fontFamily: "Archivo, sans-serif", fontWeight: 600,
          fontSize: 26, color: COLORS.offwhite,
          opacity: 0.5, letterSpacing: "0.14em", textTransform: "uppercase",
        }}>
          PATTAMANSA.COM.BR
        </span>
      </div>
    </div>
  );
};
