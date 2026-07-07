import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

const proof = [
  { value: 5, label: 'unidades em operação' },
  { value: 4, label: 'cidades atendidas' },
]

export function ExpansionBanner() {
  return (
    <Section bg="black">
      <Reveal>
        <div className="relative overflow-hidden">
          <Image
            src="/assets/images/real-facade.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.98),rgba(9,9,9,0.86),rgba(9,9,9,0.55))]" />

          <div className="relative grid gap-10 border border-lf-line p-6 md:p-10 lg:grid-cols-[1fr_0.8fr] lg:p-14">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  Expansão
                </p>
              </div>

              <h2 className="max-w-xl text-4xl font-black leading-[1.06] text-lf-text text-balance md:text-5xl">
                Rede em expansão. A próxima LoudFit pode ser sua.
              </h2>

              <p className="mt-5 max-w-sm text-base leading-[1.6] text-lf-muted">
                Seja dono de uma unidade em uma rede com marca forte, operação real e presença de bairro.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/franquias" variant="volt" size="lg">
                  Quero ser franqueado
                </Button>
                <Button href="/franquias#formulario" variant="ghost" size="lg">
                  Falar com o time
                </Button>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden border border-lf-line sm:grid-cols-2 lg:grid-cols-1">
              {proof.map(({ value, label }) => (
                <div key={label} className="flex flex-col justify-center bg-lf-graphite/80 px-6 py-5">
                  <strong className="text-4xl font-black text-lf-volt">
                    <AnimatedNumber value={value} duration={1200} />
                  </strong>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-lf-muted">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
