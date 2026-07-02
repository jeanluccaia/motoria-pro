import { OffthreadVideo, staticFile } from "remotion";
import { COLORS, CUTS, SAFE } from "../constants";
import { WordByWord } from "./shared/WordByWord";

export const ConceitoBlock: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <OffthreadVideo
      src={staticFile("base.mp4")} startFrom={CUTS.caoBola2.startFrom}
      endAt={CUTS.caoBola2.endAt} muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />

    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)",
    }} />

    {/* "A SELEÇÃO CANINA chegou" — palavras chegam em cascata */}
    <div style={{
      position: "absolute", bottom: SAFE + 20,
      left: 60, right: 60, zIndex: 10,
    }}>
      <WordByWord
        words={["A", "SELEÇÃO", "CANINA"]}
        framesPerWord={10}
        delay={4}
        style={{ marginBottom: 8 }}
        wordStyle={{
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: 102, color: COLORS.offwhite, textTransform: "uppercase",
          textShadow: "0 2px 20px rgba(0,0,0,0.9)", lineHeight: 1.0,
        }}
      />
      <WordByWord
        words={["chegou"]}
        framesPerWord={10}
        delay={30}
        wordStyle={{
          fontFamily: "Anton, Impact, sans-serif",
          fontSize: 102, color: COLORS.verde, textTransform: "uppercase",
          textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        }}
      />
    </div>
  </div>
);
