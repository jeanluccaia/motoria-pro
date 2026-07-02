import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { T } from "./constants";
import { HookBlock }     from "./components/HookBlock";
import { ConceitoBlock } from "./components/ConceitoBlock";
import { UnboxingBlock } from "./components/UnboxingBlock";
import { HeroBlock }     from "./components/HeroBlock";
import { CtaCard }       from "./components/CtaCard";

interface Props {
  hookText?: string;
  ctaText?:  string;
  oferta?:   string;
}

export const Main: React.FC<Props> = ({
  hookText = "A CAMISA DO POVO",
  ctaText  = "GARANTA A SUA",
  oferta   = "Edição Copa 2026 · Tiragem limitada",
}) => (
  <div style={{ width: 1080, height: 1920, overflow: "hidden", background: "#0A0A0A" }}>

    {/*
      Áudio contínuo — todos os OffthreadVideo são muted.
      Pega 20s de áudio da fonte a partir do segundo 5 (frame 150),
      com fade-out no último 1s da composição.
    */}
    <Audio
      src={staticFile("base.mp4")}
      startFrom={150}
      endAt={750}
      volume={(f) =>
        interpolate(f, [570, 600], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />

    {/* A — HOOK (0:00–0:03) */}
    <Sequence from={T.hook.from} durationInFrames={T.hook.dur}>
      <HookBlock hookText={hookText} />
    </Sequence>

    {/* B — CONCEITO (0:03–0:06) */}
    <Sequence from={T.conceito.from} durationInFrames={T.conceito.dur}>
      <ConceitoBlock />
    </Sequence>

    {/* C — UNBOXING comprimido (0:06–0:10) */}
    <Sequence from={T.unboxing.from} durationInFrames={T.unboxing.dur}>
      <UnboxingBlock />
    </Sequence>

    {/* D — HERO PRODUTO (0:10–0:16) */}
    <Sequence from={T.hero.from} durationInFrames={T.hero.dur}>
      <HeroBlock />
    </Sequence>

    {/* E — CTA CARD (0:16–0:20) */}
    <Sequence from={T.cta.from} durationInFrames={T.cta.dur}>
      <CtaCard ctaText={ctaText} oferta={oferta} />
    </Sequence>

  </div>
);
