import { COLORS } from "../constants";

// Overlay sutil de "campo de futebol" — linhas finas em baixíssima opacidade
// Aplicado apenas nos blocos E e F do comercial
export const TexturaBrasilidade: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 2,
    }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
    >
      {/* Linhas horizontais de campo */}
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={160 * i + 80}
          x2={1080}
          y2={160 * i + 80}
          stroke={COLORS.verde}
          strokeWidth={1.2}
          opacity={0.055}
        />
      ))}
      {/* Círculo central sutil */}
      <circle
        cx={540}
        cy={960}
        r={220}
        fill="none"
        stroke={COLORS.verde}
        strokeWidth={1.5}
        opacity={0.04}
      />
      {/* Linha do meio */}
      <line
        x1={0}
        y1={960}
        x2={1080}
        y2={960}
        stroke={COLORS.verde}
        strokeWidth={1}
        opacity={0.045}
      />
    </svg>
  </div>
);
