import type { Metadata } from 'next'
import { FounderHeader } from '@/components/founder/FounderHeader'
import { FounderFooter } from '@/components/founder/FounderFooter'
import { FounderPage } from '@/components/founder/FounderPage'
import { CampaignCountdownBar } from '@/components/founder/CampaignCountdownBar'
import { conviteConfig } from '@/lib/campaigns'

export const metadata: Metadata = {
  title: { absolute: conviteConfig.metadata.title },
  description: conviteConfig.metadata.description,
  alternates: { canonical: '/convite' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: conviteConfig.metadata.title,
    description: conviteConfig.metadata.description,
    url: '/convite',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: conviteConfig.metadata.title,
    description: conviteConfig.metadata.description,
  },
}

export default function Page() {
  return (
    <>
      <FounderHeader label={conviteConfig.headerLabel} href="/convite" />
      <CampaignCountdownBar />
      <main className="bg-[#0A0A0A]">
        <FounderPage config={conviteConfig} />
      </main>
      <FounderFooter />
    </>
  )
}
