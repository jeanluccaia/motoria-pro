import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { Composition, registerRoot } from "remotion";
import { Main } from "./Main";
import { CTA_VARIANTS } from "./constants";

// Carrega fontes globalmente
loadAnton();
loadArchivo();

export const RemotionRoot: React.FC = () => (
  <>
    {CTA_VARIANTS.map(({ id, text }) => (
      <Composition
        key={id}
        id={id}
        component={Main}
        durationInFrames={810}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ctaText: text }}
      />
    ))}
  </>
);

registerRoot(RemotionRoot);
