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
}: {
  src: string
  alt: string
  caption: string
  objectPosition: string
  className?: string
  sizes: string
}) {
  return (
    <figure className={`relative overflow-hidden bg-lf-graphite ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        style={{ objectPosition }}
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,12,0)_60%,rgba(11,11,12,0.7)_100%)]"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 md:p-4">
        <span aria-hidden="true" className="h-[2px] w-5 shrink-0 bg-lf-volt" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-lf-text md:text-[10px]">
          {caption}
        </span>
      </figcaption>
    </figure>
  )
}

export function HomeShowcase() {
  return (
    <Section
      bg="black"
      className="py-14 md:py-16 lg:py-[72px]"
    >
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-14">

        {/* Coluna copy */}
        <Reveal>
          <div className="max-w-[34rem]">
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-[2px] w-8 shrink-0 bg-lf-volt" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lf-volt">
                O melhor está aqui
              </p>
            </div>
            <h2
              className="text-balance font-black uppercase leading-[1.02] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.5rem)' }}
            >
              Treino de verdade<br />perto de você
            </h2>
            <p className="mt-4 max-w-[38ch] text-[15px] leading-[1.55] text-lf-muted md:mt-5">
              Musculação, cardio e aulas coletivas em uma estrutura completa
            </p>
          </div>
        </Reveal>

        {/* Coluna imagens — compactas */}
        <Reveal delay={0.08}>
          <div className="flex flex-col gap-3">
            {/* Imagem principal — mobile preserva aspect-[4/3]; desktop compactado */}
            <ShowcaseImage
              src={mainImage.src}
              alt={mainImage.alt}
              caption={mainImage.caption}
              objectPosition={mainImage.objectPosition}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="aspect-[4/3] md:aspect-auto md:h-[280px] lg:h-[300px]"
            />

            {/* Duas secundárias — mobile preserva aspect-[4/5] em 2-col; desktop compactado */}
            <div className="grid grid-cols-2 gap-3">
              {secondaryImages.map((img) => (
                <ShowcaseImage
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  caption={img.caption}
                  objectPosition={img.objectPosition}
                  sizes="(max-width: 1024px) 50vw, 28vw"
                  className="aspect-[4/5] md:aspect-auto md:h-[130px] lg:h-[140px]"
                />
              ))}
            </div>
          </div>
        </Reveal>

      </div>
    </Section>
  )
}
