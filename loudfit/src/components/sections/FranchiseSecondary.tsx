import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function FranchiseSecondary() {
  return (
    <Section bg="black" className="relative overflow-hidden py-16 md:py-24 lg:py-28">
      <Image
        src="/assets/images/real-facade.jpg"
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,8,0.98)_0%,rgba(8,8,8,0.86)_45%,rgba(8,8,8,0.55)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[3px] w-48 -skew-x-12 origin-left bg-lf-volt"
      />

      <Reveal>
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Expansão LoudFit
              </p>
            </div>

            <h2 className="text-balance text-4xl font-black uppercase leading-[1.02] text-lf-text md:text-5xl">
              Leve a LoudFit para <span className="text-lf-volt">sua cidade</span>
            </h2>

            <p className="mt-5 max-w-[46ch] text-base leading-[1.6] text-lf-muted">
              Leve para sua cidade uma marca forte, uma operação estruturada e uma experiência que já está em movimento.
            </p>

            <div className="mt-8">
              <Link
                href="/franquias"
                className="lf-cta-volt inline-flex min-h-[48px] items-center justify-center px-8 py-4 text-xs font-black uppercase tracking-[0.14em] transition hover:-translate-y-0.5 sm:text-sm"
              >
                Conheça a franquia
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden border border-lf-line bg-lf-graphite">
              <Image
                src="/assets/images/real-opening.jpg"
                alt="Inauguração de uma unidade LoudFit"
                fill
                sizes="40vw"
                className="object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-lf-black/40 via-transparent to-transparent" />
              <div aria-hidden="true" className="absolute top-0 left-0 h-0 w-0 border-t-[36px] border-t-lf-volt border-r-[36px] border-r-transparent" />
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
