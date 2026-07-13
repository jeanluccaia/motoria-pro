'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { trackFranchiseEvent } from '@/lib/franchise-analytics'

const HERO_IMAGE = '/media/franquias/hero/fachada-premium-franquias.webp'

export function FranchiseHero() {
  const reduce = useReducedMotion()

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
        }

  const imageEnter = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.15 },
      }

  return (
    <section
      className="relative isolate flex items-center overflow-hidden bg-lf-black pt-24 pb-14 md:min-h-[640px] md:py-16 lg:min-h-[720px] lg:py-20"
      aria-labelledby="franchise-hero-title"
    >
      <div className="relative mx-auto grid w-full max-w-[1360px] gap-10 px-5 sm:px-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center md:gap-12 lg:gap-16 lg:px-12">

        {/* Coluna texto */}
        <div className="max-w-[36rem]">
          <motion.div {...enter(0)} className="mb-6 flex items-center gap-3">
            <span aria-hidden="true" className="h-[2px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lf-volt">
              Expansão Loud Fit
            </p>
          </motion.div>

          <motion.h1
            {...enter(0.05)}
            id="franchise-hero-title"
            className="font-black uppercase leading-[1.02] tracking-[-0.01em] text-lf-text"
            style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.75rem)' }}
          >
            Leve a Loud Fit<br />para a sua cidade
          </motion.h1>

          <motion.p
            {...enter(0.12)}
            className="mt-6 max-w-[38ch] text-[15.5px] leading-[1.6] text-lf-text/80 md:mt-7 md:text-base"
          >
            Leve para sua região uma academia com identidade forte, estrutura completa e suporte em cada etapa
          </motion.p>

          <motion.div
            {...enter(0.2)}
            className="mt-8 flex flex-col items-start gap-4 md:mt-10 md:flex-row md:items-center md:gap-6"
          >
            <a
              href="#candidatura"
              onClick={() => trackFranchiseEvent('franchise_cta_hero_primary')}
              className="lf-cta-volt inline-flex min-h-[52px] w-full items-center justify-center px-8 py-4 text-sm font-black uppercase tracking-[0.12em] transition-all hover:-translate-y-0.5 active:scale-[0.99] sm:w-auto sm:text-[15px]"
            >
              Quero ser franqueado
            </a>
            <a
              href="#estrutura"
              onClick={() => trackFranchiseEvent('franchise_cta_hero_secondary')}
              className="group inline-flex min-h-[44px] items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-lf-text/70 transition-colors hover:text-lf-volt focus-visible:text-lf-volt focus-visible:outline-none"
            >
              <span className="border-b border-lf-text/25 pb-1 transition-colors group-hover:border-lf-volt">
                Conhecer o modelo
              </span>
            </a>
          </motion.div>
        </div>

        {/* Coluna imagem */}
        <motion.div
          {...imageEnter}
          className="relative mx-auto w-full max-w-[420px] md:mx-0 md:ml-auto md:max-w-none"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-lf-line/60 bg-lf-graphite/50">
            <Image
              src={HERO_IMAGE}
              alt="Imagem conceitual de fachada de uma unidade Loud Fit"
              fill
              priority
              sizes="(max-width: 768px) 88vw, (max-width: 1280px) 42vw, 560px"
              className="object-cover"
            />
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-lf-muted/60">
            Imagem conceitual
          </p>
        </motion.div>

      </div>
    </section>
  )
}
