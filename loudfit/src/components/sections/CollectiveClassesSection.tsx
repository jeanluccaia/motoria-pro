import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function CollectiveClassesSection() {
  return (
    <Section id="aulas-coletivas" bg="black" className="relative overflow-hidden">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-10">
        <Reveal className="flex">
          <div className="relative flex min-h-[520px] w-full flex-col justify-between overflow-hidden border border-lf-line bg-lf-graphite p-6 md:p-8 lg:p-10">
            <Image
              src="/assets/images/studio-community.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover opacity-38"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.94)_0%,rgba(9,9,9,0.74)_48%,rgba(9,9,9,0.22)_100%),linear-gradient(180deg,rgba(9,9,9,0.2)_0%,rgba(9,9,9,0.92)_100%)]" />
            <div className="absolute left-0 top-0 h-full w-[3px] bg-lf-volt" />

            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  Planos LoudFit
                </p>
              </div>
              <h2 className="max-w-[10ch] text-4xl font-black leading-[1.02] text-lf-text text-balance md:text-5xl lg:text-6xl">
                Um plano. Tudo incluso
              </h2>
            </div>

            <div className="relative z-10 mt-12 max-w-xl">
              <p className="text-base leading-[1.6] text-lf-muted md:text-lg">
                Musculação, Muay Thai, Pilates, Spinning, Zumba, Jump e outras aulas entram
                na mensalidade. Você escolhe o plano e treina com a grade disponível na sua
                unidade.
              </p>
              <p className="mt-4 text-xs text-lf-muted/55">
                A grade de aulas pode variar por unidade.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="flex">
          <div className="grid w-full gap-4">
            <div className="border border-lf-line bg-lf-surface p-6 md:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-lf-muted/55">
                Modelo comum
              </p>
              <div className="mt-6 flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lf-line text-sm font-black text-lf-muted/55">
                  ✗
                </span>
                <p className="pt-1 text-lg font-black leading-tight text-lf-muted/55 line-through">
                  Mensalidade + taxa por aula
                </p>
              </div>
            </div>

            <div className="border border-lf-volt bg-lf-volt p-6 text-lf-black md:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-lf-black/65">
                Na LoudFit
              </p>
              <div className="mt-6 flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lf-black text-sm font-black text-lf-volt">
                  ✓
                </span>
                <p className="pt-1 text-lg font-black leading-tight">
                  LoudFit: musculação + aulas coletivas na mesma mensalidade
                </p>
              </div>
            </div>

            <div className="border-l-2 border-lf-volt bg-lf-graphite px-6 py-5 md:px-7">
              <p className="text-sm leading-relaxed text-lf-muted">
                No <span className="font-bold text-lf-text">Power Anual Recorrente</span>, a
                primeira mensalidade sai por <span className="font-bold text-lf-volt">R$9,90</span>.
              </p>
            </div>

            <Button href="/unidades" variant="volt" size="md" className="mt-1 w-fit">
              Começar matrícula
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
