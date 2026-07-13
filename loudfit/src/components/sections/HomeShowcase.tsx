import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'

const IPIRANGA_ROOT = '/media/unidades/ipiranga-sp/fotos'

const mainImage = {
  src: `${IPIRANGA_ROOT}/musculacao-visao-geral-01.webp`,
  alt: 'Área de musculação da unidade Loud Fit Ipiranga SP',
  caption: 'Musculação',
  objectPosition: 'center',
}

const secondaryImages = [
  {
    src: `${IPIRANGA_ROOT}/cardio-esteiras-01.webp`,
    alt: 'Área de cardio da unidade Loud Fit Ipiranga SP',
    caption: 'Cardio',
    objectPosition: '50% 55%',
  },
  {
    src: `${IPIRANGA_ROOT}/sala-coletiva-01.webp`,
    alt: 'Sala de aulas coletivas da unidade Loud Fit Ipiranga SP',
    caption: 'Aulas coletivas',
    objectPosition: 'center',
  },
]

function ShowcaseImage({
  src,
  alt,
  caption,
  objectPosition,
  className,
  sizes,
  priority = false,
}: {
  src: string
  alt: string
  caption: string
  objectPosition: string
  className?: string
  sizes: string
  priority?: boolean
}) {
  return (
    <figure className={`relative overflow-hidden bg-lf-graphite ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectPosition }}
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0)_55%,rgba(11,11,12,0.72)_100%)]"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 md:p-5">
        <span aria-hidden="true" className="h-[2px] w-6 shrink-0 bg-lf-volt" />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-text">
          {caption}
        </span>
      </figcaption>
    </figure>
  )
}

export function HomeShowcase() {
  return (
    <Section bg="black" className="py-16 md:py-20 lg:py-24">
      <Reveal>
        <div className="mb-10 max-w-3xl md:mb-14">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
              O melhor ainda está por vir
            </p>
          </div>
          <h2
            className="text-balance font-black uppercase leading-[1.02] tracking-[-0.005em] text-lf-text"
            style={{ fontSize: 'clamp(2rem, 3.4vw, 3rem)' }}
          >
            Treino de verdade<br />perto de você
          </h2>
          <p className="mt-4 max-w-[46ch] text-base leading-[1.55] text-lf-muted md:mt-5 md:text-[17px]">
            Musculação, cardio e aulas coletivas em uma estrutura completa
          </p>
        </div>
      </Reveal>

      {/* Desktop: 60/40 split — imagem principal à esquerda, duas empilhadas à direita */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-5">
        <Reveal>
          <ShowcaseImage
            src={mainImage.src}
            alt={mainImage.alt}
            caption={mainImage.caption}
            objectPosition={mainImage.objectPosition}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="aspect-[4/3] md:aspect-[4/5] md:h-full"
          />
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-5">
          {secondaryImages.map((img, i) => (
            <Reveal key={img.src} delay={0.1 + i * 0.08}>
              <ShowcaseImage
                src={img.src}
                alt={img.alt}
                caption={img.caption}
                objectPosition={img.objectPosition}
                sizes="(max-width: 768px) 50vw, 30vw"
                className="aspect-[4/5] md:aspect-[16/9] md:h-full"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
