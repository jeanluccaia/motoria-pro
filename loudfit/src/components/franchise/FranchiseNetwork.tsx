'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Unit } from '@/types'

interface FranchiseNetworkProps {
  units: Unit[]
}

interface NetworkItem {
  slug: string
  displayName: string
  city: string
  status: 'operando' | 'inauguracao'
  image: string
  imageAlt: string
}

function buildItems(units: Unit[]): NetworkItem[] {
  return units
    .slice()
    .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99))
    .map((unit) => {
      const displayName = unit.nome.replace(/^Loud Fit\s+/i, '').replace(/^Loud Fit\s+/i, '')
      const facadeItem = unit.media?.gallery.find((item) => item.category === 'fachada')
      return {
        slug: unit.slug,
        displayName,
        city: `${unit.cidade} · ${unit.estado}`,
        status: unit.status === 'ativa' ? ('operando' as const) : ('inauguracao' as const),
        image: unit.media?.cover ?? unit.foto_capa,
        imageAlt: facadeItem?.alt ?? `Fachada da unidade Loud Fit ${displayName}`,
      }
    })
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  )
}

export function FranchiseNetwork({ units }: FranchiseNetworkProps) {
  const items = buildItems(units)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || items.length === 0) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const cards = Array.from(el.querySelectorAll<HTMLLIElement>('[data-carousel-item]'))
        if (!cards.length) return
        const scrollerRect = el.getBoundingClientRect()
        const scrollerCenter = scrollerRect.left + scrollerRect.width / 2
        let best = 0
        let bestDist = Number.POSITIVE_INFINITY
        cards.forEach((card, i) => {
          const cardRect = card.getBoundingClientRect()
          const cardCenter = cardRect.left + cardRect.width / 2
          const dist = Math.abs(cardCenter - scrollerCenter)
          if (dist < bestDist) {
            bestDist = dist
            best = i
          }
        })
        setActiveIndex(best)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [items.length])

  function scrollByCards(delta: number) {
    const el = scrollerRef.current
    if (!el) return
    const first = el.querySelector<HTMLLIElement>('[data-carousel-item]')
    if (!first) return
    const gap = 24
    const step = first.getBoundingClientRect().width + gap
    el.scrollBy({ left: step * delta, behavior: 'smooth' })
  }

  function scrollToIndex(i: number) {
    const el = scrollerRef.current
    if (!el) return
    const target = el.querySelector<HTMLLIElement>(`[data-carousel-index="${i}"]`)
    if (!target) return
    const offset = target.offsetLeft - el.offsetLeft
    el.scrollTo({ left: offset, behavior: 'smooth' })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCards(1) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollByCards(-1) }
    if (e.key === 'Home')       { e.preventDefault(); scrollToIndex(0) }
    if (e.key === 'End')        { e.preventDefault(); scrollToIndex(items.length - 1) }
  }

  if (items.length === 0) return null

  const canPrev = activeIndex > 0
  const canNext = activeIndex < items.length - 1

  return (
    <section
      id="rede"
      className="relative scroll-mt-24 bg-lf-black py-16 md:py-20 lg:py-24 md:scroll-mt-28"
      aria-labelledby="rede-title"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">

        <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
                A rede está crescendo
              </p>
            </div>
            <h2
              id="rede-title"
              className="text-balance font-black uppercase leading-[0.98] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(1.9rem, 3.2vw, 3rem)' }}
            >
              A Loud Fit já está<br />em expansão
            </h2>
          </div>

          <div className="flex items-center gap-3 md:self-end">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canPrev}
              aria-label="Ver unidade anterior"
              className="inline-flex h-10 w-10 items-center justify-center border border-lf-line text-lf-text/70 transition-colors hover:border-lf-volt hover:text-lf-volt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-lf-line disabled:hover:text-lf-text/70"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
              aria-label="Ver próxima unidade"
              className="inline-flex h-10 w-10 items-center justify-center border border-lf-line text-lf-text/70 transition-colors hover:border-lf-volt hover:text-lf-volt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-lf-line disabled:hover:text-lf-text/70"
            >
              <ArrowIcon direction="right" />
            </button>
            <Link
              href="/unidades"
              className="ml-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-lf-text/85 transition-colors hover:text-lf-volt focus-visible:outline-none focus-visible:text-lf-volt"
            >
              Conheça nossas unidades
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroller — carrossel manual com scroll-snap, sem autoplay */}
      <div className="mx-auto w-full max-w-[1360px]">
        <ul
          ref={scrollerRef}
          role="list"
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label="Carrossel de unidades Loud Fit"
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-5 pb-2 focus-visible:outline-none sm:px-8 lg:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <li
              key={item.slug}
              data-carousel-item
              data-carousel-index={i}
              className="w-[280px] shrink-0 snap-start sm:w-[360px] md:w-[420px] lg:w-[500px]"
            >
              <article className="flex flex-col border border-lf-line bg-lf-graphite/60">
                <div className="relative aspect-[16/10] w-full bg-lf-black">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 500px"
                    style={{ objectPosition: 'center' }}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2 p-5">
                  <span
                    className={
                      'inline-flex w-fit items-center gap-1.5 border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ' +
                      (item.status === 'operando'
                        ? 'border-lf-volt/60 bg-lf-volt/10 text-lf-volt'
                        : 'border-lf-text/25 bg-lf-black/60 text-lf-text/80')
                    }
                  >
                    {item.status === 'operando' ? 'Em operação' : 'Em inauguração'}
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-text/60">
                    {item.city}
                  </p>
                  <h3
                    className="font-black uppercase leading-[1.02] tracking-[-0.005em] text-lf-text"
                    style={{ fontSize: 'clamp(1.15rem, 1.4vw, 1.4rem)' }}
                  >
                    {item.displayName}
                  </h3>
                  <Link
                    href={`/unidades/${item.slug}`}
                    className="mt-1 inline-flex w-fit items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-lf-text/70 transition-colors hover:text-lf-volt focus-visible:outline-none focus-visible:text-lf-volt"
                  >
                    Conhecer a unidade
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {/* Indicadores */}
      <div className="mx-auto mt-6 flex w-full max-w-[1360px] items-center justify-center gap-2 px-5 sm:px-8 lg:px-12">
        {items.map((item, i) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Ir para ${item.displayName}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            className={
              'h-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60 ' +
              (i === activeIndex ? 'w-8 bg-lf-volt' : 'w-4 bg-lf-line hover:bg-lf-text/40')
            }
          />
        ))}
      </div>
    </section>
  )
}
