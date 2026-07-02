import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { COLORS, CUTS, SAFE } from "../constants";
import { WordByWord } from "./shared/WordByWord";

interface Props { hookText: string }

const textBase: React.CSSProperties = {
  fontFamily: "Anton, Impact, sans-serif",
  textTransform: "uppercase",
  textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7)",
  lineHeight: 1.05,
};

export const HookBlock: React.FC<Props> = ({ hookText }) => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>

    {/* Sub-seq 1: flash camisa (0-14, 0.5s) */}
    <Sequence from={0} durationInFrames={15}>
      <OffthreadVideo
        src={staticFile("base.mp4")} startFrom={CUTS.flashCamisa.startFrom}
        endAt={CUTS.flashCamisa.endAt} muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>

    {/* Sub-seq 2: cão+bola (15-89) */}
    <Sequence from={15} durationInFrames={75}>
      <OffthreadVideo
        src={staticFile("base.mp4")} startFrom={CUTS.caoBola1.startFrom}
        endAt={CUTS.caoBola1.endAt} muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>

    {/* Gradient para legibilidade do texto no terço inferior */}
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 52%)",
    }} />

    {/* Texto gancho — terço inferior, entra no frame 2 */}
    <Sequence from={2}>
      <div style={{
        position: "absolute", bottom: SAFE + 20,
        left: 60, right: 60, zIndex: 10,
      }}>
        <WordByWord
          words={hookText.split(" ")}
          framesPerWord={8}
          style={{ justifyContent: "flex-start", marginBottom: 12 }}
          wordStyle={{ ...textBase, fontSize: 92, color: COLORS.offwhite, letterSpacing: "0.02em" }}
        />
        <div style={{
          fontFamily: "Archivo, sans-serif", fontWeight: 800,
          fontSize: 42, color: COLORS.amarelo, letterSpacing: "0.12em",
          textTransform: "uppercase", textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          marginTop: 4,
        }}>
          Edição Copa 2026 🇧🇷
        </div>
      </div>
    </Sequence>

  </div>
);
