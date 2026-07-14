import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function FranchiseSecondary() {
  return (
    <Section bg="black" className="relative overflow-hidden py-14 md:py-16 lg:py-20">
      {/* Textura de fachada apenas como fundo sutil */}
      <Image
        src="/assets/images/real-facade.jpg"
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,8,0.98)_0%,rgba(8,8,8,0.86)_45%,rgba(8,8,8,0.55)_100%)]"
      />

      <Reveal>
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
              Expansão Loud Fit
            </p>
          </div>

          <h2
            className="text-balance font-black uppercase leading-[1.02] tracking-[-0.005em] text-lf-text"
            style={{ fontSize: 'clamp(2rem, 3.2vw, 3rem)' }}
          >
            A próxima Loud Fit<br />pode ser na <span className="text-lf-volt">sua cidade</span>
          </h2>

          <p className="mt-5 max-w-[42ch] text-base leading-[1.55] text-lf-muted">
            Conheça o modelo de franquia e leve a rede para a sua região
          </p>

          <div className="mt-8">
            <Link
              href="/franquias"
              className="lf-cta-volt inline-flex min-h-[48px] items-center justify-center px-8 py-4 text-xs font-black uppercase tracking-[0.14em] transition hover:-translate-y-0.5 sm:text-sm"
            >
              Quero conhecer a franquia
            </Link>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
