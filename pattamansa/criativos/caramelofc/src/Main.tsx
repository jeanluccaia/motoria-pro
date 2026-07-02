import { Sequence } from "remotion";
import { T } from "./constants";
import { GanchoNativo } from "./components/GanchoNativo";
import { Conteudo1 } from "./components/Conteudo1";
import { Conteudo2 } from "./components/Conteudo2";
import { PayoffPonte } from "./components/PayoffPonte";
import { ComercialColecao } from "./components/ComercialColecao";
import { CtaFinal } from "./components/CtaFinal";

interface Props {
  ctaText?: string;
}

// ── Transição cross-dissolve entre blocos ─────────────────────────────────────
// Remotion não tem cross-dissolve nativo sem o @remotion/transitions package.
// Usamos corte seco aqui; para dissolve instalar @remotion/transitions e substituir.
// ─────────────────────────────────────────────────────────────────────────────

export const Main: React.FC<Props> = ({ ctaText = "COMPRE AGORA NA PATTAMANSA" }) => (
  <div style={{ width: 1080, height: 1920, overflow: "hidden", background: "#0A0A0A" }}>

    {/* A — GANCHO (0:00–0:03) */}
    <Sequence from={T.gancho.from} durationInFrames={T.gancho.dur}>
      <GanchoNativo />
    </Sequence>

    {/* B — CONTEÚDO 1 (0:03–0:09) */}
    <Sequence from={T.conteudo1.from} durationInFrames={T.conteudo1.dur}>
      <Conteudo1 />
    </Sequence>

    {/* C — CONTEÚDO 2 (0:09–0:15) — 2 cortes internos */}
    <Sequence from={T.conteudo2.from} durationInFrames={T.conteudo2.dur}>
      <Conteudo2 />
    </Sequence>

    {/* D — PAYOFF / PONTE (0:15–0:19) — duck + legendas */}
    <Sequence from={T.payoff.from} durationInFrames={T.payoff.dur}>
      <PayoffPonte />
    </Sequence>

    {/* E — COMERCIAL COLEÇÃO (0:19–0:26) */}
    <Sequence from={T.comercial.from} durationInFrames={T.comercial.dur}>
      <ComercialColecao />
    </Sequence>

    {/* F — CTA / LOGO (0:26–0:27) */}
    <Sequence from={T.cta.from} durationInFrames={T.cta.dur}>
      <CtaFinal ctaText={ctaText} />
    </Sequence>

  </div>
);
