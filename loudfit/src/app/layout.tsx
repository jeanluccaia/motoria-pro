import type { Metadata } from 'next'
import { Inter, Big_Shoulders } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' })
const displayFont = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    template: '%s | LoudFit',
    default: 'LoudFit — A Rede que Treina Alto',
  },
  description:
    'Academia premium com rede de unidades. Treine acima do low cost. Seja sócio de uma LoudFit.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loudfit.com.br'),
  openGraph: {
    siteName: 'LoudFit',
    locale: 'pt_BR',
    type: 'website',
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
