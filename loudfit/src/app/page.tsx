import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { InstitutionalStrip } from '@/components/sections/InstitutionalStrip'
import { StructureCards } from '@/components/sections/StructureCards'
import { PlansSection } from '@/components/sections/PlansSection'
import { StepsSection } from '@/components/sections/StepsSection'
import { UnitsCompactList } from '@/components/sections/UnitsCompactList'
import { EnergiaQueSeOuve } from '@/components/sections/EnergiaQueSeOuve'
import { FranchiseSecondary } from '@/components/sections/FranchiseSecondary'
import { FinalCta } from '@/components/sections/FinalCta'
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat'

export const metadata: Metadata = {
  title: { absolute: 'LoudFit | Academia com musculação e aulas inclusas' },
  description:
    'Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LoudFit | Academia com musculação e aulas inclusas',
    description:
      'Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano.',
    url: '/',
    images: ['/og-loudfit-logo-v3.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoudFit | Academia com musculação e aulas inclusas',
    description:
      'Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano.',
    images: ['/og-loudfit-logo-v3.jpg'],
  },
}

export default function HomePage() {
  return (
    <>
      {/* 1. Hero — vídeo, headline "Aqui, o treino fala mais alto" */}
      <Hero />

      {/* 2. Institucional clara — lema "O melhor ainda está por vir" acima do título */}
      <InstitutionalStrip />

      {/* 3. Estrutura escura — 3 cards (Musculação, Cardio, Aulas Coletivas) */}
      <StructureCards />

      {/* 4. Planos claros — 4 cards com "Ver benefícios e condições" */}
      <PlansSection />

      {/* 5. Como funciona — 3 passos, fundo claro */}
      <StepsSection />

      {/* 6. Unidades escura — lista compacta */}
      <UnitsCompactList />

      {/* 7. Energia que se ouve — só renderiza se houver conteúdo real */}
      <EnergiaQueSeOuve />

      {/* 8. Franquia secundária escura */}
      <FranchiseSecondary />

      {/* 9. CTA final amarelo full-width */}
      <FinalCta />

      <WhatsAppFloat />
    </>
  )
}
