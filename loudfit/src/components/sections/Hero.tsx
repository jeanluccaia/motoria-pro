import Link from 'next/link'

const HERO_DESKTOP = '/media/hero/hero-outubro.webp'
const HERO_MOBILE = '/media/hero/hero-outubro-mobile.webp'

const OFFER_HREF = '/unidades?plano=power-trimestral'
const OFFER_ALT =
  'Loud Fit: 3 meses de treino por R$ 99 por mês. Plano trimestral com camiseta Loud Fit de presente. Oferta válida até 14/10/2026.'

// Coordenadas do botão "COMECE AGORA" desenhado na arte, em porcentagem
// do container. Como o container preserva o aspect-ratio da arte via
// `aspect-[W/H]`, o link se mantém alinhado em qualquer largura.
// Medidas conferidas contra os originais 1942x809 (desktop) e 1086x1448
// (mobile) do Canva.
const MOBILE_BUTTON = { left: '5.5%', top: '19%', width: '55%', height: '6%' }
const DESKTOP_BUTTON = { left: '1.8%', top: '77%', width: '13%', height: '10%' }

export function Hero() {
  return (
    <section
      aria-label={OFFER_ALT}
      className="relative isolate overflow-hidden bg-white pt-16"
    >
      {/* Container preserva a proporção original da arte para manter o botão
          desenhado alinhado com o link acessível abaixo. Em desktop muito
          largo o container é limitado a 2000px para não esticar demais. */}
      <div className="relative mx-auto w-full aspect-[1086/1448] md:aspect-[1942/809] md:max-w-[2000px]">
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

        {/* Link acessível sobre o "COMECE AGORA" desenhado na arte.
            Coordenadas em % ancoram o link em qualquer largura desde que o
            container mantenha o aspect-ratio da arte. */}
        <Link
          href={OFFER_HREF}
          aria-label="Comece agora — plano Trimestral"
          className="absolute rounded-full ring-offset-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-black md:hidden"
          style={{
            left: MOBILE_BUTTON.left,
            top: MOBILE_BUTTON.top,
            width: MOBILE_BUTTON.width,
            height: MOBILE_BUTTON.height,
          }}
        >
          <span className="sr-only">Comece agora</span>
        </Link>
        <Link
          href={OFFER_HREF}
          aria-label="Comece agora — plano Trimestral"
          className="absolute hidden rounded-full ring-offset-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lf-black md:block"
          style={{
            left: DESKTOP_BUTTON.left,
            top: DESKTOP_BUTTON.top,
            width: DESKTOP_BUTTON.width,
            height: DESKTOP_BUTTON.height,
          }}
        >
          <span className="sr-only">Comece agora</span>
        </Link>
      </div>
    </section>
  )
}
