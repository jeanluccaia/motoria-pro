import type { Metadata } from 'next'
import { Inter, Big_Shoulders } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import './globals.css'
import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GlobalChrome } from '@/components/layout/GlobalChrome'
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts'
import { ConsentBanner } from '@/components/analytics/ConsentBanner'
import { siteUrl } from '@/lib/site'

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' })
const displayFont = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  adjustFontFallback: false,
  variable: '--font-display',
})

const siteTitle = 'Loud Fit | Academia com musculação e aulas inclusas'
const siteDescription =
  'Aqui, o treino fala mais alto. Musculação, cardio e aulas coletivas em um só plano. Escolha sua unidade. O melhor está aqui'

export const metadata: Metadata = {
  title: {
    template: '%s | Loud Fit',
    default: siteTitle,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: '/',
    siteName: 'Loud Fit',
    locale: 'pt_BR',
    type: 'website',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/og-image.jpg'],
  },
  verification: {
    other: {
      'facebook-domain-verification': '1mr7t2qceqtw2c4k9ebowwz5cumsv5',
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full ${bodyFont.variable} ${displayFont.variable}`}>
      <GoogleTagManager gtmId="GTM-KF5DBT6L" />
      <body className="min-h-full flex flex-col bg-lf-black text-lf-text">
        <Suspense fallback={null}>
          <AnalyticsScripts />
        </Suspense>
        <GlobalChrome>
          <Header />
        </GlobalChrome>
        <main className="flex-1">{children}</main>
        <GlobalChrome>
          <Footer />
        </GlobalChrome>
        <ConsentBanner />
      </body>
    </html>
  )
}
