import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function InstitutionalStrip() {
  return (
    <Section bg="cream" className="py-14 md:py-20 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">

        <Reveal>
          <div className="max-w-xl">
            {/* Lema oficial LoudFit — assinatura institucional acima do título */}
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#7A6900]">
              O melhor ainda está por vir
            </p>

            <h2 className="text-balance text-4xl font-black leading-[1.02] text-[#141414] md:text-5xl">
              Treino de verdade, perto de você
            </h2>

            <p className="mt-5 max-w-[42ch] text-base leading-[1.6] text-[#4A4A4A]">
              Uma rede em expansão, com estrutura completa, aulas coletivas inclusas e uma comunidade que treina junto todo dia.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative aspect-[4/3] overflow-hidden border border-[#D8D5CE] bg-lf-graphite shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
            <Image
              src="/assets/images/studio-community.jpg"
              alt="Ambiente de aula coletiva em uma unidade LoudFit"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-lf-black/40 via-transparent to-transparent" />
            <div aria-hidden="true" className="absolute top-0 left-0 h-0 w-0 border-t-[36px] border-t-lf-volt border-r-[36px] border-r-transparent" />
          </div>
        </Reveal>

      </div>
    </Section>
  )
}
