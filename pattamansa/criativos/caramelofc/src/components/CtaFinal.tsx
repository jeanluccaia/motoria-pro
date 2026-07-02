import {
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from "remotion";
import { COLORS, SAFE } from "../constants";
import { TexturaBrasilidade } from "./TexturaBrasilidade";

interface Props {
  ctaText?: string;
}

export const CtaFinal: React.FC<Props> = ({ ctaText = "COMPRE AGORA NA PATTAMANSA" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterLogo = spring({ frame, fps, config: { damping: 28, stiffness: 130 } });
  const enterCta  = spring({ frame: frame - 8, fps, config: { damping: 24, stiffness: 150 } });
  const enterSub  = spring({ frame: frame - 14, fps, config: { damping: 22, stiffness: 140 } });

  // Micro-pulse único no logo (frame 6-16)
  const pulse = frame >= 6 && frame <= 16
    ? interpolate(frame, [6, 11, 16], [1, 1.035, 1])
    : 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.preto,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <TexturaBrasilidade />

      {/* Logo PattaMansa */}
      <div
        style={{
          zIndex: 5,
          opacity: interpolate(enterLogo, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enterLogo, [0, 1], [30, 0])}px) scale(${pulse})`,
          marginBottom: 48,
          maxWidth: 320,
        }}
      >
        <Img
          src={staticFile("logo-pattamansa.webp")}
          style={{ width: "100%", objectFit: "contain" }}
        />
      </div>

      {/* CTA principal */}
      <div
        style={{
          zIndex: 5,
          opacity: interpolate(enterCta, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enterCta, [0, 1], [20, 0])}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontFamily: "Anton, Impact, sans-serif",
            fontSize: 72,
            color: COLORS.amarelo,
            textTransform: "uppercase",
            lineHeight: 1.05,
            letterSpacing: "0.04em",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          {ctaText}
        </div>
      </div>

      {/* Sub CTA */}
      <div
        style={{
          zIndex: 5,
          opacity: interpolate(enterSub, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enterSub, [0, 1], [16, 0])}px)`,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: 30,
            color: COLORS.offwhite,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.75,
          }}
        >
          PATTAMANSA.COM.BR
        </span>
      </div>

      {/* "A camisa do povo" — tagline */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE + 20,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 5,
          opacity: interpolate(enterSub, [0, 1], [0, 0.55]),
        }}
      >
        <span
          style={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: 24,
            color: COLORS.verde,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          A CAMISA DO POVO
        </span>
      </div>
    </div>
  );
};
