import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { CUTS } from "../constants";
import { KickerSuperior } from "./KickerSuperior";

export const GanchoNativo: React.FC = () => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>
    <OffthreadVideo
      src={staticFile("base.mp4")}
      startFrom={CUTS.gancho.startFrom}
      endAt={CUTS.gancho.endAt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
    {/* Kicker entra logo no frame 4 para não colidir com o arranque visual */}
    <Sequence from={4}>
      <KickerSuperior text="O ERRO QUE TODO TUTOR COMETE" />
    </Sequence>
  </div>
);
