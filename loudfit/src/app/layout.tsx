import type { Metadata } from 'next'
import { Inter, Big_Shoulders } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { siteUrl } from '@/lib/site'

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' })
const displayFont = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  adjustFontFallback: false,
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    template: '%s | LoudFit',
    default: 'LoudFit | O melhor ainda está por vir',
  },
  description:
    'Rede de academias com energia, estrutura e experiência para quem leva o treino a sério.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LoudFit | O melhor ainda está por vir',
    description:
      'Rede de academias com energia, estrutura e experiência para quem leva o treino a sério.',
    url: '/',
    siteName: 'LoudFit',
    locale: 'pt_BR',
    type: 'website',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoudFit | O melhor ainda está por vir',
    description:
      'Rede de academias com energia, estrutura e experiência para quem leva o treino a sério.',
    images: ['/assets/images/campaign-gym-16x9.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full ${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-full flex flex-col bg-lf-black text-lf-text">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
