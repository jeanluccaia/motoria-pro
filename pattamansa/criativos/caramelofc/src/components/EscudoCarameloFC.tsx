import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../constants";

// SVG lockup tipográfico do escudo — usado quando escudo-caramelo-fc.png não existe
export const EscudoCarameloFC: React.FC<{ size?: number }> = ({ size = 320 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 24, stiffness: 140 } });
  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const w = size;
  const h = size * 1.2;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg width={w} height={h} viewBox="0 0 200 240" fill="none">
        {/* Forma de brasão */}
        <path
          d="M100 8 L192 48 L192 140 Q192 200 100 232 Q8 200 8 140 L8 48 Z"
          fill={COLORS.verdeEscuro}
          stroke={COLORS.amarelo}
          strokeWidth="6"
        />
        {/* Faixa interna */}
        <path
          d="M100 22 L180 56 L180 138 Q180 192 100 218 Q20 192 20 138 L20 56 Z"
          fill="none"
          stroke={COLORS.amarelo}
          strokeWidth="2"
          opacity={0.4}
        />
        {/* Filetes de campo — brasilidade sutil */}
        {[0.35, 0.5, 0.65].map((y, i) => (
          <line
            key={i}
            x1={30}
            y1={h * y * (240 / h)}
            x2={170}
            y2={h * y * (240 / h)}
            stroke={COLORS.amarelo}
            strokeWidth={0.8}
            opacity={0.18}
          />
        ))}
        {/* Texto CARAMELO FC */}
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fontFamily="Anton, Impact, sans-serif"
          fontSize="34"
          fill={COLORS.amarelo}
          letterSpacing="1"
        >
          CARAMELO
        </text>
        <text
          x="100"
          y="142"
          textAnchor="middle"
          fontFamily="Anton, Impact, sans-serif"
          fontSize="28"
          fill={COLORS.offwhite}
          letterSpacing="2"
        >
          FC
        </text>
        {/* Estrela decorativa */}
        <text x="100" y="78" textAnchor="middle" fontSize="18" fill={COLORS.amarelo}>
          ★
        </text>
      </svg>
    </div>
  );
};
