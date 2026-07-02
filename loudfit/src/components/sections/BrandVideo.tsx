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
    <Section bg="black" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(242,226,5,0.12),transparent_28%),linear-gradient(180deg,rgba(22,22,22,0),rgba(22,22,22,0.38))]" />
      <div className="relative grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-lf-volt">Experiência LoudFit</p>
          <h2 className="mt-5 max-w-xl text-5xl font-black leading-none text-lf-text md:text-7xl">
            Sala cheia. Energia real.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-lf-muted md:text-lg">
            Um recorte da rotina LoudFit: estrutura, intensidade e presença de rede para quem treina sério.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/unidades" variant="volt" size="lg">
              Ver unidades
            </Button>
            <Button href="#planos" variant="ghost" size="lg">
              Ver planos
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-lf-volt/25 bg-lf-surface shadow-[0_0_60px_rgba(242,226,5,0.08)]">
          <div className="absolute -right-12 -top-12 z-10 h-36 w-36 rounded-full bg-lf-volt/10 blur-2xl" />
          <div className="relative aspect-video overflow-hidden">
            <video
              ref={videoRef}
              src="/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label="Vídeo institucional LoudFit"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lf-black/60 via-transparent to-transparent" />
            <button
              type="button"
              onClick={toggleSound}
              className="absolute bottom-5 right-5 rounded-full border border-lf-volt/40 bg-lf-black/80 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-lf-volt backdrop-blur transition hover:bg-lf-volt hover:text-lf-black"
            >
              {muted ? 'Ativar som' : 'Silenciar'}
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}
