import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, SAFE } from "../constants";

interface Props {
  text?: string;
}

export const KickerSuperior: React.FC<Props> = ({
  text = "O ERRO QUE TODO TUTOR COMETE",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 180, mass: 0.7 } });
  const y = interpolate(enter, [0, 1], [-60, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE + 20,
        left: 0,
        right: 0,
        transform: `translateY(${y}px)`,
        opacity,
        zIndex: 10,
      }}
    >
      {/* Barra de fundo */}
      <div
        style={{
          background: "rgba(10,10,10,0.85)",
          padding: "14px 40px",
          borderBottom: `4px solid ${COLORS.amarelo}`,
        }}
      >
        <span
          style={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 36,
            textTransform: "uppercase",
            color: COLORS.offwhite,
            letterSpacing: "0.08em",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
