'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

export function BrandVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const poster = '/assets/images/real-machines.jpg'
  const videoObjectPosition = 'center center'

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    if (video.paused) {
      void video.play()
    }
  }

  return (
    <Section bg="black" className="relative py-20 md:py-28">
      <div className="relative grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-16">

        {/* Texto */}
        <Reveal>
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                Estrutura LoudFit
              </p>
            </div>
            <h2 className="text-4xl font-black leading-[1.02] text-lf-text text-balance md:text-5xl">
              Veja a LoudFit por dentro.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-[1.6] text-lf-muted">
              Musculação, aulas coletivas e estrutura completa para treinar todos os dias.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/unidades" variant="volt" size="lg">
                Ver unidades
              </Button>
              <Button href="/#planos" variant="ghost" size="lg">
                Ver planos
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Vídeo */}
        <Reveal delay={0.15}>
          <div className="relative overflow-hidden border-l-2 border-lf-volt">
            {/* Detalhe diagonal — canto superior direito */}
            <div className="absolute top-0 right-0 z-10 h-0 w-0 border-t-[36px] border-t-lf-volt border-l-[36px] border-l-transparent" />

            <div className="relative aspect-[4/5] overflow-hidden bg-lf-graphite md:aspect-video">
              {videoFailed ? (
                <Image
                  src={poster}
                  alt="Estrutura interna da academia LoudFit"
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                  style={{ objectPosition: videoObjectPosition }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src="/hero.mp4"
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  poster={poster}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onError={() => setVideoFailed(true)}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: videoObjectPosition }}
                  aria-label="Vídeo da academia LoudFit"
                />
              )}

              {/* Overlay gradiente elegante */}
              <div className="absolute inset-0 bg-gradient-to-t from-lf-black/50 via-transparent to-transparent" />

              {/* Botão play — centralizado, visível antes de iniciar */}
              {!playing && !videoFailed && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label="Reproduzir vídeo"
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <span className="flex h-16 w-16 items-center justify-center border-2 border-white/60 bg-lf-black/60 text-white transition-all duration-200 group-hover:border-lf-volt group-hover:bg-lf-volt group-hover:text-lf-black backdrop-blur-sm">
                    <PlayIcon />
                  </span>
                </button>
              )}

              {/* Controles */}
              {!videoFailed && (
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                    title={playing ? 'Pausar' : 'Reproduzir'}
                    className="flex h-9 w-9 items-center justify-center border border-lf-line bg-lf-black/85 text-lf-text transition-all duration-150 hover:border-lf-volt hover:text-lf-volt backdrop-blur-sm"
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-label={muted ? 'Ativar som' : 'Silenciar'}
                    title={muted ? 'Ativar som' : 'Silenciar'}
                    className="flex h-9 w-9 items-center justify-center border border-lf-line bg-lf-black/85 text-lf-text transition-all duration-150 hover:border-lf-volt hover:text-lf-volt backdrop-blur-sm"
                  >
                    {muted ? <SoundOffIcon /> : <SoundOnIcon />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Reveal>

      </div>
    </Section>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function SoundOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  )
}

function SoundOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  )
}
