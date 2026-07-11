'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const POSTER = '/assets/images/hero-gym-desktop.png'
const VIDEO_SRC = '/hero.mp4'

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getReducedMotionServer() {
  return false
}

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [muted, setMuted] = useState(true)
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (reduceMotion) {
      try { v.pause() } catch {}
    } else if (!videoFailed) {
      const p = v.play()
      if (p && typeof p.then === 'function') p.catch(() => { /* autoplay bloqueado — poster segura */ })
    }
  }, [reduceMotion, videoFailed])

  function toggleSound() {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next
    setMuted(next)
    if (v.paused) {
      const p = v.play()
      if (p && typeof p.then === 'function') p.catch(() => { /* autoplay bloqueado */ })
    }
  }

  const showVideo = !videoFailed && !reduceMotion

  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-lf-black pt-16 md:min-h-[72vh] lg:min-h-[86vh]">

      {/* Vídeo de fundo */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER}
          onCanPlay={(e) => {
            const v = e.currentTarget
            const p = v.play()
            if (p && typeof p.then === 'function') p.catch(() => { /* autoplay bloqueado */ })
          }}
          onError={() => setVideoFailed(true)}
          aria-hidden="true"
          disablePictureInPicture
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[58%_28%] opacity-75 md:object-[58%_28%] md:opacity-70 lg:object-[60%_22%] 2xl:object-[62%_18%]"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* Poster fallback (visível se vídeo falhar OU se prefers-reduced-motion) */}
      {!showVideo && (
        <Image
          src={POSTER}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[62%_35%] opacity-70 md:object-[58%_28%] lg:object-[60%_22%] 2xl:object-[62%_18%]"
        />
      )}

      {/* Overlay para contraste — mais leve no mobile, mais forte no desktop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,8,8,0.35)_0%,rgba(8,8,8,0.20)_45%,rgba(8,8,8,0.90)_100%)] md:bg-[linear-gradient(180deg,rgba(8,8,8,0.55)_0%,rgba(8,8,8,0.30)_40%,rgba(8,8,8,0.92)_100%),linear-gradient(90deg,rgba(8,8,8,0.85)_0%,rgba(8,8,8,0.35)_55%,rgba(8,8,8,0.10)_100%)]"
      />

      {/* Traço diagonal amarelo — identidade LoudFit */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-56 -skew-x-12 origin-left bg-lf-volt" />

      {/* Controle de som — premium, discreto, canto superior direito */}
      {showVideo && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Ativar som do vídeo' : 'Silenciar vídeo'}
          aria-pressed={!muted}
          className="group absolute right-4 top-20 z-20 flex items-center gap-2 border border-white/15 bg-lf-black/45 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-lf-text/85 backdrop-blur-md transition-all duration-200 hover:border-lf-volt/60 hover:bg-lf-black/70 hover:text-lf-volt focus-visible:outline-none focus-visible:border-lf-volt md:right-8 md:top-24 md:px-4 md:py-2.5 md:text-[11px] lg:right-12"
        >
          <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">
            {muted ? <SoundOffIcon /> : <SoundOnIcon />}
          </span>
          <span className="hidden sm:inline">{muted ? 'Ativar som' : 'Silenciar'}</span>
        </button>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 pb-14 sm:px-8 md:pb-20 lg:px-12 lg:pb-28">

        <div className="mb-5 flex items-center gap-3">
          <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            Rede de academias
          </p>
        </div>

        <h1
          className="max-w-[15ch] font-black uppercase leading-[0.98] tracking-[-0.005em] text-lf-text"
          style={{ fontSize: 'clamp(2.4rem, 5.4vw, 5.6rem)' }}
        >
          Aqui, o treino<br />fala mais <span className="text-lf-volt">alto</span>
        </h1>

        <p className="mt-5 max-w-[36ch] text-sm leading-[1.55] text-lf-text/85 sm:text-base md:mt-6 md:max-w-[42ch] md:text-lg">
          Musculação, cardio e aulas coletivas em um só plano.
        </p>

        <div className="mt-8 flex flex-col items-start gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-6">
          <Button
            href="#encontre-sua-loudfit"
            variant="volt"
            size="lg"
            className="min-h-[52px] px-8 py-4 text-sm font-black tracking-[0.12em] sm:text-base"
          >
            Escolha sua unidade
          </Button>
          <Link
            href="#planos"
            className="group text-[12px] font-semibold uppercase tracking-[0.18em] text-lf-text/70 transition-colors hover:text-lf-volt focus-visible:outline-none focus-visible:text-lf-volt sm:text-[13px]"
          >
            Ver planos
            <span aria-hidden="true" className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
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
