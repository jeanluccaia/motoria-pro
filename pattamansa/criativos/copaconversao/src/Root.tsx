import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { Composition, registerRoot } from "remotion";
import { Main } from "./Main";

loadAnton();
loadArchivo();

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PattaMansa_CopaConversao"
    component={Main}
    durationInFrames={600}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      hookText: "A CAMISA DO POVO",
      ctaText:  "GARANTA A SUA",
      oferta:   "Edição Copa 2026 · Tiragem limitada",
    }}
  />
);

registerRoot(RemotionRoot);
