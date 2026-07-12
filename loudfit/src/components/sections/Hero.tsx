'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

const DESKTOP_IMAGE = '/assets/images/hero-gym-desktop.png'
const MOBILE_POSTER_INLINE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 6"><rect width="10" height="6" fill="%23080808"/></svg>'
const VIDEO_SRC = '/hero.mp4'
const MOBILE_QUERY = '(max-width: 767px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/* ------------ prefers-reduced-motion ------------ */
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

/* ------------ mobile breakpoint ------------ */
function subscribeMobile(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(MOBILE_QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}
function getIsMobile() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_QUERY).matches
}
function getIsMobileServer() {
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

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [muted, setMuted] = useState(true)
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer)
  const isMobile = useSyncExternalStore(subscribeMobile, getIsMobile, getIsMobileServer)

  // Vídeo só existe no mobile e quando não há redução de movimento
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

  function toggleSound() {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next
    setMuted(next)
    if (v.paused) safePlay(v)
  }

  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-lf-black pt-16 md:min-h-[72vh] lg:min-h-[86vh]">

      {/* Preload agressivo do vídeo — apenas em mobile (economia de banda no desktop) */}
      <link rel="preload" as="video" href={VIDEO_SRC} type="video/mp4" media={MOBILE_QUERY} />

      {/* Imagem desktop — sempre presente. No mobile fica invisível quando o vídeo estiver ativo. */}
      <Image
        src={DESKTOP_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className={
          'absolute inset-0 -z-10 h-full w-full object-cover object-[62%_35%] opacity-70 md:object-[58%_28%] md:opacity-70 lg:object-[60%_22%] 2xl:object-[62%_18%]' +
          (showVideo ? ' hidden' : '')
        }
      />

      {/* Vídeo — só em mobile */}
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
          className="absolute inset-0 -z-10 h-full w-full bg-lf-black object-cover object-[58%_28%] opacity-80"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* Overlay para contraste — mais leve no mobile, mais forte no desktop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,8,8,0.35)_0%,rgba(8,8,8,0.20)_45%,rgba(8,8,8,0.90)_100%)] md:bg-[linear-gradient(180deg,rgba(8,8,8,0.55)_0%,rgba(8,8,8,0.30)_40%,rgba(8,8,8,0.92)_100%),linear-gradient(90deg,rgba(8,8,8,0.85)_0%,rgba(8,8,8,0.35)_55%,rgba(8,8,8,0.10)_100%)]"
      />

      {/* Traço diagonal amarelo — identidade LoudFit */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

      {/* Controle de som — só aparece quando há vídeo (mobile) */}
      {showVideo && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Ativar som do vídeo' : 'Silenciar vídeo'}
          aria-pressed={!muted}
          className="group absolute right-4 top-20 z-20 flex items-center gap-2 border border-white/15 bg-lf-black/45 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-lf-text/85 backdrop-blur-md transition-all duration-200 hover:border-lf-volt/60 hover:bg-lf-black/70 hover:text-lf-volt focus-visible:outline-none focus-visible:border-lf-volt"
        >
          <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">
            {muted ? <SoundOffIcon /> : <SoundOnIcon />}
          </span>
          <span className="hidden xs:inline sm:inline">{muted ? 'Ativar som' : 'Silenciar'}</span>
        </button>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 pb-14 sm:px-8 md:pb-20 lg:px-12 lg:pb-28">

        <h1
          className="max-w-[16ch] font-black uppercase leading-[0.98] tracking-[-0.005em] text-lf-text md:max-w-[15ch]"
          style={{ fontSize: 'clamp(2.3rem, 5.4vw, 5.6rem)' }}
        >
          Aqui, o treino<br />fala mais <span className="text-lf-volt">alto</span>
        </h1>

        <p className="mt-5 max-w-[34ch] text-sm leading-[1.55] text-lf-text/85 sm:text-base md:mt-6 md:max-w-[42ch] md:text-lg">
          Musculação, cardio e aulas coletivas em um só plano
        </p>

        <div className="mt-7 sm:mt-10">
          <Button
            href="#encontre-sua-loudfit"
            variant="volt"
            size="md"
            className="min-h-[46px] px-6 py-3 text-[13px] font-black tracking-[0.12em] sm:min-h-[52px] sm:px-8 sm:py-4 sm:text-base"
          >
            Escolha sua unidade
          </Button>
        </div>

      </div>
    </section>
  )
}

function SoundOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function SoundOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}
