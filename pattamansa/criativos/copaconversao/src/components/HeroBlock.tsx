import { OffthreadVideo, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { COLORS, CUTS, SAFE } from "../constants";

export const HeroBlock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Texto entra após 20 frames (dá tempo de ver a camisa primeiro)
  const enterTitle = spring({ frame: frame - 20, fps, config: { damping: 22, stiffness: 140 } });
  const enterSub   = spring({ frame: frame - 35, fps, config: { damping: 22, stiffness: 130 } });

  const yTitle = interpolate(enterTitle, [0, 1], [36, 0]);
  const ySub   = interpolate(enterSub,   [0, 1], [28, 0]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <OffthreadVideo
        src={staticFile("base.mp4")} startFrom={CUTS.heroCamisa.startFrom}
        endAt={CUTS.heroCamisa.endAt} muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Gradiente inferior para texto (área livre — não cobre estampa central) */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 45%)",
      }} />

      {/* CARAMELO FC */}
      <div style={{
        position: "absolute", bottom: SAFE + 80,
        left: 60, right: 60, zIndex: 10,
        transform: `translateY(${yTitle}px)`,
        opacity: interpolate(enterTitle, [0, 1], [0, 1]),
      }}>
        <div style={{
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: 110, color: COLORS.amarelo,
          textTransform: "uppercase", lineHeight: 0.95,
          letterSpacing: "0.03em",
          textShadow: "0 3px 24px rgba(0,0,0,0.9)",
        }}>
          CARAMELO FC
        </div>
      </div>

      {/* Subtítulo */}
      <div style={{
        position: "absolute", bottom: SAFE + 20,
        left: 60, right: 60, zIndex: 10,
        transform: `translateY(${ySub}px)`,
        opacity: interpolate(enterSub, [0, 1], [0, 1]),
      }}>
        <div style={{
          fontFamily: "Archivo, sans-serif", fontWeight: 600,
          fontSize: 36, color: COLORS.offwhite,
          textTransform: "uppercase", letterSpacing: "0.1em",
          textShadow: "0 2px 12px rgba(0,0,0,0.9)",
        }}>
          A Seleção que todo brasileiro torce
        </div>
      </div>
    </div>
  );

};
