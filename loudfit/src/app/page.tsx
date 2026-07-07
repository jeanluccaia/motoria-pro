import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { HomeUnitsGrid } from '@/components/sections/HomeUnitsGrid'
import { PlansSection } from '@/components/sections/PlansSection'
import { CollectiveClassesSection } from '@/components/sections/CollectiveClassesSection'
import { BrandVideo } from '@/components/sections/BrandVideo'
import { OfferBanner } from '@/components/sections/OfferBanner'
import { ExpansionBanner } from '@/components/sections/ExpansionBanner'
import { FinalCta } from '@/components/sections/FinalCta'
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat'

export const metadata: Metadata = {
  title: { absolute: 'LoudFit | O melhor ainda está por vir' },
  description:
    'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LoudFit | O melhor ainda está por vir',
    description:
      'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
    url: '/',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoudFit | O melhor ainda está por vir',
    description:
      'Rede de academias com estrutura completa, aulas coletivas inclusas e matrícula 100% online.',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
}

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — preto */}
      <Hero />
      {/* 2. Encontre sua LoudFit — claro */}
      <HomeUnitsGrid />
      {/* 3. Planos — claro */}
      <PlansSection />
      {/* 4. Um plano. Tudo incluso. — preto */}
      <CollectiveClassesSection />
      {/* 5. Estrutura + Vídeo — claro */}
      <BrandVideo />
      {/* 6. Como funciona — claro */}
      <OfferBanner />
      {/* 7. Franquia — preto */}
      <ExpansionBanner />
      {/* 8. CTA Final — preto */}
      <FinalCta />
      <WhatsAppFloat />
    </>
  )
}
