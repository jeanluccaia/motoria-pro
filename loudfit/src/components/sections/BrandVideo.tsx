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
      <div className="relative grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-lf-volt mb-5">
            A academia por dentro
          </p>
          <h2 className="max-w-xl text-4xl font-black leading-none text-lf-text md:text-6xl">
            Sala cheia. Estrutura de verdade.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-lf-muted">
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

        <div className="relative overflow-hidden border border-lf-line bg-lf-surface">
          <div className="relative aspect-video overflow-hidden">
            <video
              ref={videoRef}
              src="/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label="Vídeo da academia LoudFit"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lf-black/50 via-transparent to-transparent" />
            <button
              type="button"
              onClick={toggleSound}
              className="absolute bottom-4 right-4 border border-lf-line bg-lf-black/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-lf-volt transition hover:bg-lf-volt hover:text-lf-black"
            >
              {muted ? 'Ativar som' : 'Silenciar'}
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}
