import { COLORS } from "../../constants";

export const TexturaBrasilidade: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={0} y1={192 * i + 96} x2={1080} y2={192 * i + 96}
          stroke={COLORS.verde} strokeWidth={1} opacity={0.05} />
      ))}
      <circle cx={540} cy={960} r={200} fill="none"
        stroke={COLORS.verde} strokeWidth={1.2} opacity={0.035} />
    </svg>
  </div>
);
