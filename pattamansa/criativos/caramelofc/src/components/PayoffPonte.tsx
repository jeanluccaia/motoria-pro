import {
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Audio,
} from "remotion";
import { COLORS, BRIDGE, CUTS, SAFE } from "../constants";

// Uma frase da ponte — entra com spring, sai com fade
const BridgeWord: React.FC<{ text: string; startFrame: number }> = ({
  text,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  if (local < 0) return null;

  const pop = spring({ frame: local, fps, config: { damping: 18, stiffness: 200, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.72, 1]);
  const opacity = interpolate(pop, [0, 1], [0, 1]);

  // Destaca palavra-chave em verde ou amarelo
  const isKey = text.includes("TODO") || text.includes("CAMISA");
  const color = isKey ? COLORS.amarelo : COLORS.offwhite;

  return (
    <div
      style={{
        position: "absolute",
        bottom: SAFE + 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${scale})`,
        opacity,
        padding: "0 60px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: 84,
          color,
          textTransform: "uppercase",
          lineHeight: 1.05,
          textShadow: "0 2px 16px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6)",
          letterSpacing: "0.02em",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const PayoffPonte: React.FC = () => {
  const frame = useCurrentFrame();
  // Duck suave: de 1 → 0.2 nos primeiros 20 frames do bloco D
  const volume = interpolate(frame, [0, 20], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Vídeo base — plano calmo de caminhada/cão tranquilo */}
      <OffthreadVideo
        src={staticFile("base.mp4")}
        startFrom={CUTS.payoff.startFrom}
        endAt={CUTS.payoff.endAt}
        volume={volume}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Overlay escurecido suave pra legenda ganhar contraste */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 60%)",
        }}
      />

      {/* Trilha bed (opcional — arquivo trilha.mp3 em /public) */}
      {/* <Audio src={staticFile("trilha.mp3")} startFrom={0} volume={0.35} /> */}

      {/* Legendas da ponte — palavra a palavra */}
      {BRIDGE.map((b) => (
        <BridgeWord key={b.text} text={b.text} startFrame={b.startFrame} />
      ))}
    </div>
  );
};
