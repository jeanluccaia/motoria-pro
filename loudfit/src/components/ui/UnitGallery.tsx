'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface UnitGalleryImage {
  src: string
  alt: string
  fit?: 'cover' | 'contain'
  position?: string
}

interface UnitGalleryProps {
  images: UnitGalleryImage[]
  unitName: string
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
      {direction === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  )
}

export function UnitGallery({ images, unitName }: UnitGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || images.length === 0) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const slides = Array.from(el.querySelectorAll<HTMLElement>('[data-gallery-slide]'))
        if (!slides.length) return
        const rect = el.getBoundingClientRect()
        const center = rect.left + rect.width / 2
        let best = 0
        let bestDist = Number.POSITIVE_INFINITY
        slides.forEach((s, i) => {
          const sr = s.getBoundingClientRect()
          const sc = sr.left + sr.width / 2
          const d = Math.abs(sc - center)
          if (d < bestDist) { bestDist = d; best = i }
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
  }, [images.length])

  function goTo(i: number) {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(images.length - 1, i))
    const slide = el.querySelector<HTMLElement>(`[data-gallery-index="${clamped}"]`)
    if (!slide) return
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(activeIndex + 1) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(activeIndex - 1) }
    if (e.key === 'Home')       { e.preventDefault(); goTo(0) }
    if (e.key === 'End')        { e.preventDefault(); goTo(images.length - 1) }
  }

  if (images.length === 0) return null

  const canPrev = activeIndex > 0
  const canNext = activeIndex < images.length - 1

  return (
    <div className="relative">
      {/* Main scroller — mobile e desktop compartilham o mesmo scroll-snap */}
      <div className="relative overflow-hidden rounded-lg bg-lf-black">
        <div
          ref={scrollerRef}
          role="region"
          tabIndex={0}
          aria-label={`Galeria de fotos da unidade ${unitName}`}
          onKeyDown={onKeyDown}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/50 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={img.src}
              data-gallery-slide
              data-gallery-index={i}
              aria-hidden={i !== activeIndex ? 'true' : undefined}
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-lf-black"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1100px"
                priority={i === 0}
                style={{ objectPosition: img.position ?? 'center' }}
                className={img.fit === 'contain' ? 'object-contain' : 'object-cover'}
              />
            </div>
          ))}
        </div>

        {/* Contador — sobreposto discreto */}
        <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-lf-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-lf-text backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </div>

        {/* Setas — desktop overlay discreto */}
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          disabled={!canPrev}
          aria-label="Foto anterior"
          className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-lf-black/60 p-3 text-lf-text transition hover:bg-lf-volt hover:text-lf-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-lf-black/60 disabled:hover:text-lf-text md:flex"
        >
          <ArrowIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          disabled={!canNext}
          aria-label="Próxima foto"
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-lf-black/60 p-3 text-lf-text transition hover:bg-lf-volt hover:text-lf-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-lf-black/60 disabled:hover:text-lf-text md:flex"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>

      {/* Thumbnails — apenas desktop */}
      <div className="mt-3 hidden gap-2 overflow-x-auto md:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Mostrar foto ${i + 1} de ${images.length}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            className={cn(
              'relative aspect-[4/3] h-16 shrink-0 overflow-hidden rounded border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60',
              i === activeIndex
                ? 'border-lf-volt opacity-100'
                : 'border-transparent opacity-60 hover:opacity-90',
            )}
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="90px"
              style={{ objectPosition: img.position ?? 'center' }}
              className={img.fit === 'contain' ? 'object-contain bg-lf-black' : 'object-cover'}
            />
          </button>
        ))}
      </div>

      {/* Indicadores — apenas mobile */}
      <div className="mt-4 flex items-center justify-center gap-1.5 md:hidden">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir para foto ${i + 1} de ${images.length}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            className={cn(
              'h-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-volt/60',
              i === activeIndex ? 'w-6 bg-lf-volt' : 'w-1.5 bg-lf-line hover:bg-lf-text/40',
            )}
          />
        ))}
      </div>
    </div>
  )
}
