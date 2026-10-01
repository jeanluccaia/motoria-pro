import Link from 'next/link'

const HERO_DESKTOP = '/media/hero/hero-outubro.webp'
const HERO_MOBILE = '/media/hero/hero-outubro-mobile.webp'

const OFFER_HREF = '/unidades?plano=power-trimestral'
const OFFER_ALT =
  'Loud Fit: 3 meses de treino por R$ 99 por mês. Plano trimestral com camiseta Loud Fit de presente. Oferta válida até 31/10/2026.'

export function Hero() {
  return (
    <section
      aria-label={OFFER_ALT}
      className="relative isolate overflow-hidden bg-white pt-16"
    >
      {/* A capa INTEIRA é um único link para a página de unidades. Clicar
          em qualquer parte da arte — inclusive no "COMECE AGORA" desenhado
          — leva a /unidades?plano=power-trimestral. */}
      <Link
        href={OFFER_HREF}
        aria-label="Comece agora — plano Trimestral, 3 meses por R$ 99/mês"
        className="relative mx-auto block w-full cursor-pointer aspect-[1086/1448] md:aspect-[1942/809] md:max-w-[2000px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-lf-volt"
      >
        <img
          src={HERO_MOBILE}
          alt={OFFER_ALT}
          fetchPriority="high"
          decoding="async"
          width={1080}
          height={1440}
          className="absolute inset-0 h-full w-full object-cover md:hidden"
        />
        <img
          src={HERO_DESKTOP}
          alt={OFFER_ALT}
          fetchPriority="high"
          decoding="async"
          width={2000}
          height={833}
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        />
      </Link>

    </section>
  )
}
