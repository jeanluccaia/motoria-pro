import { OffthreadVideo, staticFile } from "remotion";
import { CUTS } from "../constants";

// Bloco B — trainer + cão, legenda queimada preservada, sem legenda Remotion nova.
export const Conteudo1: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <OffthreadVideo
      src={staticFile("base.mp4")}
      startFrom={CUTS.conteudo1.startFrom}
      endAt={CUTS.conteudo1.endAt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </div>
);
