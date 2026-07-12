'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { trackFounderEvent } from '@/lib/founder-analytics'

const DESKTOP_IMAGE = '/assets/images/hero-gym-desktop.png'
const MOBILE_POSTER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 6"><rect width="10" height="6" fill="%23080808"/></svg>'
const VIDEO_SRC = '/hero.mp4'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(REDUCED_MOTION_QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}
function getReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}
function getReducedMotionServer() {
  return false
}

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

interface FounderHeroProps {
  guestName?: string
}

export function FounderHero({ guestName }: FounderHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  )

  const showVideo = !videoFailed && !reduceMotion

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (!showVideo) {
      try {
        v.pause()
      } catch {}
      return
    }
    safePlay(v)
  }, [showVideo])

  function handleCtaClick() {
    trackFounderEvent('founder_cta_click', { source: 'hero' })
    if (typeof document === 'undefined') return
    const target = document.getElementById('condicao-fundador')
    if (!target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const greetName = guestName?.trim().toUpperCase()

  return (
    <section
      className="relative isolate flex items-end overflow-hidden bg-[#050505]"
      style={{ minHeight: 'clamp(560px, 82vh, 820px)' }}
    >
      {/* Background image (always) */}
      <Image
        src={DESKTOP_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className={
          'absolute inset-0 -z-10 h-full w-full object-cover object-[62%_28%] opacity-70 md:object-[58%_22%] lg:object-[60%_18%]' +
          (showVideo ? ' md:hidden' : '')
        }
      />

      {/* Video — plays whenever motion is allowed */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={MOBILE_POSTER}
          onCanPlay={(e) => safePlay(e.currentTarget)}
          onLoadedData={(e) => safePlay(e.currentTarget)}
          onError={() => setVideoFailed(true)}
          aria-hidden="true"
          disablePictureInPicture
          className="absolute inset-0 -z-10 h-full w-full bg-[#050505] object-cover object-[58%_28%] opacity-80"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg,rgba(10,10,10,0.55) 0%,rgba(10,10,10,0.30) 40%,rgba(10,10,10,0.86) 100%)',
        }}
      />

      <div
        className="relative z-10 mx-auto w-full max-w-[1360px] px-5 pb-14 pt-24 sm:px-8 md:pb-20 md:pt-28 lg:px-20 lg:pb-28"
        style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
      >
        <div className="max-w-[760px]">
          <p
            className="mb-4 text-[11px] font-bold uppercase tracking-[0.30em] text-[#FFE000] sm:mb-5 sm:text-xs"
            style={{ animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) both' }}
          >
            CONVITE EXCLUSIVO
          </p>

          <p
            className="uppercase text-lf-text"
            style={{
              fontFamily: 'var(--font-founder-display), Anton, sans-serif',
              fontSize: 'clamp(15px, 2.2vw, 24px)',
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              animation: 'lfFounderUp 0.55s cubic-bezier(0.2,0.7,0.2,1) 0.08s both',
            }}
          >
            {greetName ? (
              <>
                <span style={{ color: '#FFE000' }}>{greetName}</span>, ESTE CONVITE É PARA VOCÊ
              </>
            ) : (
              <>ESTE CONVITE É PARA VOCÊ</>
            )}
          </p>

          <h1
            className="mt-3 uppercase text-lf-text"
            style={{
              fontFamily: 'var(--font-founder-display), Anton, sans-serif',
              fontSize: 'clamp(42px, 7vw, 104px)',
              letterSpacing: '-0.01em',
              lineHeight: 0.9,
              animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.16s both',
            }}
          >
            FAÇA PARTE DO
            <br />
            LOTE FUNDADOR
            <br />
            <span style={{ color: '#FFE000' }}>LOUD FIT</span>
          </h1>

          <p
            className="mt-5 max-w-[440px] text-[15px] leading-[1.55] text-white/70 sm:text-base md:mt-6 md:text-[17px]"
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.24s both' }}
          >
            Uma condição pensada para quem entra desde o começo
          </p>

          <div
            className="mt-7 sm:mt-8"
            style={{ animation: 'lfFounderUp 0.6s cubic-bezier(0.2,0.7,0.2,1) 0.32s both' }}
          >
            <button
              type="button"
              onClick={handleCtaClick}
              className="lf-cta-volt inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[10px] px-7 py-4 text-[13px] font-black uppercase tracking-[0.10em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 sm:text-[14px]"
            >
              VER MINHA CONDIÇÃO
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
