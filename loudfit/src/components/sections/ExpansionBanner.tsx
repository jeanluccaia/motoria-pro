import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

const proof = [
  ['5', 'unidades em operação'],
  ['1', 'em implantação — Mogi Mirim'],
  ['4', 'cidades atendidas'],
]

export function ExpansionBanner() {
  return (
    <Section bg="black">
      <Reveal>
        <div className="relative overflow-hidden border border-lf-volt/20 bg-lf-graphite shadow-[0_32px_100px_rgba(0,0,0,0.34)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lf-volt to-transparent" />
          <Image
            src="/assets/images/campaign-gym-16x9.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.98),rgba(10,10,10,0.82),rgba(10,10,10,0.46))]" />
          <div className="relative grid gap-10 p-6 md:p-10 lg:grid-cols-[1fr_0.86fr] lg:p-14">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-lf-volt">Expansão</p>
              <h2 className="mt-5 max-w-3xl text-5xl font-black leading-none text-lf-text md:text-7xl">
                A LoudFit está crescendo.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-lf-muted md:text-lg">
                Cresça junto. Seja dono de uma unidade em uma rede com marca forte, operação real e presença de bairro.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Button href="/franquias" variant="volt" size="lg">
                  Quero ser franqueado
                </Button>
                <Button href="/franquias#formulario" variant="outline" size="lg">
                  Falar com o time
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {proof.map(([value, label]) => (
                <div key={label} className="border-l-2 border-lf-volt bg-lf-black/70 p-5 backdrop-blur">
                  <strong className="text-4xl font-black text-lf-volt">{value}</strong>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-lf-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
