import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

type EnergiaItem = { type: 'image'; src: string; alt: string; caption: string }

/**
 * Preenchimento manual quando houver conteúdo real (fotos autorais Loud Fit
 * de comunidade, eventos, treinos). Deixe vazio para ocultar a seção — a Home
 * não deve exibir placeholders cinza.
 */
const items: EnergiaItem[] = []

export function EnergiaQueSeOuve() {
  if (items.length === 0) return null

  return (
    <Section bg="cream" className="py-14 md:py-20">
      <Reveal>
        <div className="mb-8 max-w-2xl md:mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Comunidade
            </p>
          </div>
          <h2 className="text-3xl font-black leading-[1.06] text-[#141414] md:text-4xl">
            Energia que se ouve
          </h2>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.src} delay={i * 0.08}>
            <figure className="relative aspect-[4/3] overflow-hidden border border-[#E4DFD4] bg-white">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lf-black/80 to-transparent p-3 text-xs font-medium text-white">
                {item.caption}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
