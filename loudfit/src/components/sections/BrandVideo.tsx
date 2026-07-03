'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export function BrandVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    void video.play()
  }

  return (
    <Section bg="black" className="relative overflow-hidden py-20 md:py-28">
      <div className="relative grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:gap-16">

        {/* Texto */}
        <div>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
            A academia por dentro
          </p>
          <h2 className="text-4xl font-black leading-[1.02] text-lf-text md:text-5xl">
            Sala cheia.<br />Estrutura de verdade.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-lf-muted">
            Musculação, aulas coletivas e espaço para quem treina todo dia.
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

        {/* Vídeo */}
        <div className="relative overflow-hidden">
          <div className="relative aspect-video overflow-hidden">
            <video
              ref={videoRef}
              src="/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              poster="/assets/images/real-machines.jpg"
              className="h-full w-full object-cover"
              aria-label="Vídeo da academia LoudFit"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lf-black/40 via-transparent to-transparent" />

            {/* Botão de som */}
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
              className="absolute bottom-4 right-4 flex items-center gap-2 border border-lf-line bg-lf-black/85 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-lf-text transition-all duration-150 hover:border-lf-volt hover:text-lf-volt backdrop-blur-sm"
            >
              {muted ? (
                <>
                  <SoundOffIcon />
                  Som
                </>
              ) : (
                <>
                  <SoundOnIcon />
                  Mudo
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </Section>
  )
}

function SoundOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  )
}

function SoundOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  )
}
