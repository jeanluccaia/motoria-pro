import { OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { COLORS, CUTS, SAFE } from "../constants";

const EcoBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const y = interpolate(enter, [0, 1], [-30, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div style={{
      position: "absolute", top: SAFE + 30, left: 60, zIndex: 10,
      transform: `translateY(${y}px)`, opacity,
    }}>
      <div style={{
        background: COLORS.verdeEscuro,
        borderRadius: 999,
        padding: "14px 28px",
        display: "inline-flex", alignItems: "center", gap: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}>
        <span style={{ fontSize: 28 }}>🌱</span>
        <span style={{
          fontFamily: "Archivo, sans-serif", fontWeight: 700,
          fontSize: 32, color: COLORS.offwhite,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          Embalagem biodegradável
        </span>
      </div>
    </div>
  );
};

export const UnboxingBlock: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>

    {/* Rasgar embalagem (0-89, 3s) */}
    <Sequence from={0} durationInFrames={90}>
      <OffthreadVideo
        src={staticFile("base.mp4")} startFrom={CUTS.rasgar.startFrom}
        endAt={CUTS.rasgar.endAt} muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>

    {/* Beat eco / texto biodegradável (90-119, 1s) */}
    <Sequence from={90} durationInFrames={30}>
      <OffthreadVideo
        src={staticFile("base.mp4")} startFrom={CUTS.eco.startFrom}
        endAt={CUTS.eco.endAt} muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>

    {/* Badge entra no frame 10, fica visível durante todo o bloco */}
    <Sequence from={10}>
      <EcoBadge />
    </Sequence>

  </div>
);
