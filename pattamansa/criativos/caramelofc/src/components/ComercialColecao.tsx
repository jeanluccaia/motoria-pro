import {
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
} from "remotion";
import { COLORS, COM, SAFE } from "../constants";
import { EscudoCarameloFC } from "./EscudoCarameloFC";
import { TexturaBrasilidade } from "./TexturaBrasilidade";

// ── Ken Burns em foto estática ─────────────────────────────────────────────────
const KenBurns: React.FC<{ children: React.ReactNode; dur: number }> = ({
  children,
  dur,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [1.0, 1.04], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};

// ── Texto de impacto do comercial ─────────────────────────────────────────────
const ImpactText: React.FC<{
  label: string;
  title: string;
  color?: string;
  delayTitle?: number;
}> = ({ label, title, color = COLORS.amarelo, delayTitle = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterLabel = spring({ frame, fps, config: { damping: 26, stiffness: 140 } });
  const enterTitle = spring({ frame: frame - delayTitle, fps, config: { damping: 22, stiffness: 160 } });

  return (
    <div
      style={{
        position: "absolute",
        bottom: SAFE + 40,
        left: 0,
        right: 0,
        padding: "0 60px",
        zIndex: 10,
      }}
    >
      {/* Label pequeno */}
      <div
        style={{
          opacity: interpolate(enterLabel, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enterLabel, [0, 1], [24, 0])}px)`,
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 32,
          textTransform: "uppercase",
          color: COLORS.offwhite,
          letterSpacing: "0.18em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {/* Título grande */}
      <div
        style={{
          opacity: interpolate(enterTitle, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enterTitle, [0, 1], [32, 0])}px)`,
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: 88,
          textTransform: "uppercase",
          color,
          lineHeight: 1.0,
          letterSpacing: "0.03em",
          textShadow: "0 4px 24px rgba(0,0,0,0.7)",
        }}
      >
        {title}
      </div>
    </div>
  );
};

// ── E1: Reveal da camisa ──────────────────────────────────────────────────────
const CamisaReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 26, stiffness: 120 } });
  const scale = interpolate(enter, [0, 1], [1.05, 1.0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const shadow = interpolate(enter, [0, 1], [0, 60]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.preto,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <TexturaBrasilidade />
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          filter: `drop-shadow(0 ${shadow / 4}px ${shadow}px rgba(31,168,76,0.3))`,
          zIndex: 5,
          maxWidth: "80%",
          maxHeight: "75%",
        }}
      >
        <Img
          src={staticFile("camisa-frente.webp")}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
      <ImpactText label="COLEÇÃO" title="CARAMELO FC" color={COLORS.amarelo} />
    </div>
  );
};

// ── E2: Close da estampa ──────────────────────────────────────────────────────
const EstampaClose: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: COLORS.preto, position: "relative" }}>
    <TexturaBrasilidade />
    <KenBurns dur={COM.estampaClose.dur}>
      <Img
        src={staticFile("camisa-detalhe.webp")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </KenBurns>
    {/* Overlay escuro para contraste */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(10,10,10,0.80) 0%, transparent 55%)",
      }}
    />
    <ImpactText label="" title="A CAMISA DO POVO" color={COLORS.verde} delayTitle={5} />
  </div>
);

// ── E3: Elemento caramelo (cão / imagem lifestyle) ────────────────────────────
const CarameloElemento: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: COLORS.preto, position: "relative" }}>
    <TexturaBrasilidade />
    <KenBurns dur={COM.caramelo.dur}>
      <Img
        src={staticFile("caramelo.webp")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </KenBurns>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(10,10,10,0.78) 0%, transparent 50%)",
      }}
    />
    <ImpactText
      label=""
      title="O CLUBE QUE TODO BRASILEIRO CONHECE"
      color={COLORS.offwhite}
      delayTitle={5}
    />
  </div>
);

// ── E4: Escudo Caramelo FC centralizado ────────────────────────────────────────
const EscudoReveal: React.FC = () => (
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
    <div style={{ zIndex: 5 }}>
      <EscudoCarameloFC size={340} />
    </div>
  </div>
);

// ── ComercialColecao (bloco E completo) ───────────────────────────────────────
export const ComercialColecao: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <Sequence from={COM.camisaReveal.from} durationInFrames={COM.camisaReveal.dur}>
      <CamisaReveal />
    </Sequence>
    <Sequence from={COM.estampaClose.from} durationInFrames={COM.estampaClose.dur}>
      <EstampaClose />
    </Sequence>
    <Sequence from={COM.caramelo.from} durationInFrames={COM.caramelo.dur}>
      <CarameloElemento />
    </Sequence>
    <Sequence from={COM.escudo.from} durationInFrames={COM.escudo.dur}>
      <EscudoReveal />
    </Sequence>
  </div>
);
