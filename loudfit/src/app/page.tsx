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
  title: { absolute: 'Loud Fit | Academia com musculação e aulas inclusas' },
  description:
    'Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Loud Fit | Academia com musculação e aulas inclusas',
    description:
      'Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano.',
    url: '/',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loud Fit | Academia com musculação e aulas inclusas',
    description:
      'Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano.',
    images: ['/opengraph-image'],
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
