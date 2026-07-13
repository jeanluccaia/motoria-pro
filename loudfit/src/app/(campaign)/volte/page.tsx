import type { Metadata } from 'next'
import { FounderHeader } from '@/components/founder/FounderHeader'
import { FounderFooter } from '@/components/founder/FounderFooter'
import { FounderPage } from '@/components/founder/FounderPage'
import { volteConfig } from '@/lib/campaigns'

export const metadata: Metadata = {
  title: { absolute: volteConfig.metadata.title },
  description: volteConfig.metadata.description,
  alternates: { canonical: '/volte' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: volteConfig.metadata.title,
    description: volteConfig.metadata.description,
    url: '/volte',
    images: ['/opengraph-image'],
  },
}

export default function Page() {
  return (
    <>
      <FounderHeader label={volteConfig.headerLabel} href="/volte" />
      <main className="bg-[#0A0A0A]">
        <FounderPage config={volteConfig} />
      </main>
      <FounderFooter />
    </>
  )
}
