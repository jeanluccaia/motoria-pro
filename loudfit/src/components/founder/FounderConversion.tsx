import { FounderForm } from './FounderForm'
import type { FounderPlan } from '@/lib/founder-plans'

interface FounderConversionProps {
  plan: FounderPlan
}

export function FounderConversion({ plan }: FounderConversionProps) {
  return (
    <section
      id="fazer-parte"
      className="border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(76px, 9vw, 108px) clamp(24px, 5vw, 80px)',
      }}
    >
      <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
        <h2
          className="uppercase text-lf-text"
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            fontSize: 'clamp(29px, 4.5vw, 56px)',
            letterSpacing: '-0.01em',
            lineHeight: 0.96,
            margin: 0,
          }}
        >
          QUERO FAZER PARTE
          <br />
          DO LOTE FUNDADOR
        </h2>
        <p className="mb-11 mt-6 max-w-[420px] text-[14.5px] leading-[1.65] text-white/60 sm:mb-12 sm:text-[15.5px]">
          Confirme seu interesse para a equipe continuar o atendimento
        </p>

        <FounderForm plan={plan} />
      </div>
    </section>
  )
}
