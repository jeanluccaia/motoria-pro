'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { trackFranchiseEvent } from '@/lib/franchise-analytics'

const DESKTOP_IMAGE = '/assets/images/real-facade.jpg'
const MOBILE_POSTER = '/assets/images/real-opening.jpg'
const MOBILE_POSTER_INLINE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 6"><rect width="10" height="6" fill="%230B0B0C"/></svg>'
const VIDEO_SRC = '/hero.mp4'
const MOBILE_QUERY = '(max-width: 767px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeMedia(query: string) {
  return (callback: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
    const mq = window.matchMedia(query)
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }
}
function matchesMedia(query: string) {
  return () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  }
}
const serverFalse = () => false

function safePlay(v: HTMLVideoElement) {
  const p = v.play()
  if (p && typeof p.then === 'function') {
    p.catch(() => {
      v.muted = true
      const retry = v.play()
      if (retry && typeof retry.then === 'function') retry.catch(() => {})
    })
  }
}

interface FranchiseHeroProps {
  units: { operating: number; total: number; cities: number }
}

export function FranchiseHero({ units }: FranchiseHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const isMobile = useSyncExternalStore(subscribeMedia(MOBILE_QUERY), matchesMedia(MOBILE_QUERY), serverFalse)
  const reduceMotion = useSyncExternalStore(subscribeMedia(REDUCED_MOTION_QUERY), matchesMedia(REDUCED_MOTION_QUERY), serverFalse)

  const showVideo = isMobile && !videoFailed && !reduceMotion

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (!showVideo) {
      try { v.pause() } catch {}
      return
    }
    safePlay(v)
  }, [showVideo])

  return (
    <section
      className="relative isolate flex min-h-[620px] items-end overflow-hidden bg-lf-black pt-16 md:min-h-[78vh] lg:min-h-[88vh]"
      aria-labelledby="franchise-hero-title"
    >
      <link rel="preload" as="video" href={VIDEO_SRC} type="video/mp4" media={MOBILE_QUERY} />

      <Image
        src={DESKTOP_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className={
          'absolute inset-0 -z-10 h-full w-full object-cover object-[62%_42%] opacity-75 md:object-[64%_32%] md:opacity-72 lg:object-[65%_28%]' +
          (showVideo ? ' hidden' : '')
        }
      />

      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={MOBILE_POSTER_INLINE}
          onCanPlay={(e) => safePlay(e.currentTarget)}
          onLoadedData={(e) => safePlay(e.currentTarget)}
          onError={() => setVideoFailed(true)}
          aria-hidden="true"
          disablePictureInPicture
          className="absolute inset-0 -z-10 h-full w-full bg-lf-black object-cover object-[62%_35%] opacity-85"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* Poster below the video — reduces flash while the video buffers on slow mobile. */}
      {showVideo && (
        <Image
          src={MOBILE_POSTER}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_35%]"
        />
      )}

      {/* Overlay — keeps facility visible while providing legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,11,12,0.55)_0%,rgba(11,11,12,0.30)_45%,rgba(11,11,12,0.94)_100%)] md:bg-[linear-gradient(180deg,rgba(11,11,12,0.62)_0%,rgba(11,11,12,0.32)_38%,rgba(11,11,12,0.94)_100%),linear-gradient(90deg,rgba(11,11,12,0.82)_0%,rgba(11,11,12,0.3)_58%,rgba(11,11,12,0.08)_100%)]"
      />

      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 pb-14 sm:px-8 md:pb-24 lg:px-12 lg:pb-28">

        <div className="mb-5 flex items-center gap-3">
          <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
            Expansão LoudFit
          </p>
        </div>

        <h1
          id="franchise-hero-title"
          className="max-w-[18ch] font-black uppercase leading-[0.94] tracking-[-0.005em] text-lf-text md:max-w-[22ch]"
          style={{ fontSize: 'clamp(2.5rem, 5.6vw, 6.2rem)' }}
        >
          Sua cidade pode ser a próxima<br />a treinar <span className="text-lf-volt">mais alto</span>
        </h1>

        <p className="mt-6 max-w-[42ch] text-base leading-[1.55] text-lf-text/85 sm:text-lg md:mt-7 md:max-w-[52ch]">
          A LoudFit é uma rede em expansão, com estrutura completa, aulas coletivas inclusas e operação real em quatro cidades.
        </p>

        <div className="mt-8 flex flex-col items-start gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
          <a
            href="#candidatura"
            onClick={() => trackFranchiseEvent('franchise_cta_hero_primary')}
            className="lf-cta-volt inline-flex min-h-[52px] items-center justify-center px-8 py-4 text-sm font-black uppercase tracking-[0.12em] transition-all hover:-translate-y-0.5 active:scale-[0.99] sm:text-base"
          >
            Quero ser franqueado
          </a>
          <a
            href="#modelo"
            onClick={() => trackFranchiseEvent('franchise_cta_hero_secondary')}
            className="inline-flex min-h-[52px] items-center justify-center border border-lf-text/25 px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-lf-text/90 transition-colors hover:border-lf-volt hover:text-lf-volt sm:text-base"
          >
            Conhecer o modelo
          </a>
        </div>

        {/* Prova qualitativa — dados validados a partir de src/lib/supabase.ts */}
        <dl
          aria-label="Prova de operação"
          className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-lf-line/70 pt-6 md:mt-14"
        >
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.24em] text-lf-muted">Unidades</dt>
            <dd className="mt-1 font-black leading-none text-lf-text" style={{ fontSize: 'clamp(2rem, 3.4vw, 3rem)' }}>
              0{units.total}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.24em] text-lf-muted">Em operação</dt>
            <dd className="mt-1 font-black leading-none text-lf-text" style={{ fontSize: 'clamp(2rem, 3.4vw, 3rem)' }}>
              0{units.operating}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.24em] text-lf-muted">Cidades</dt>
            <dd className="mt-1 font-black leading-none text-lf-text" style={{ fontSize: 'clamp(2rem, 3.4vw, 3rem)' }}>
              0{units.cities}
            </dd>
          </div>
        </dl>

      </div>
    </section>
  )
}
