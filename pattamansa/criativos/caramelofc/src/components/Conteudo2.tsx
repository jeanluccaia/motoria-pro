import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { CUTS } from "../constants";

// Bloco C — dois cortes rápidos; legenda queimada do base preservada.
export const Conteudo2: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    {/* Corte C2a: beat "CERTO" */}
    <Sequence from={0} durationInFrames={120}>
      <OffthreadVideo
        src={staticFile("base.mp4")}
        startFrom={CUTS.c2a.startFrom}
        endAt={CUTS.c2a.endAt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>

    {/* Corte C2b: beat "A PUXAR A GUIA" */}
    <Sequence from={120} durationInFrames={60}>
      <OffthreadVideo
        src={staticFile("base.mp4")}
        startFrom={CUTS.c2b.startFrom}
        endAt={CUTS.c2b.endAt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>
  </div>
);
