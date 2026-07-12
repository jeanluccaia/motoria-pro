import type { Metadata } from 'next'
import { Anton, Archivo } from 'next/font/google'

const founderDisplay = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-founder-display',
})

const founderBody = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-founder-body',
})

export const metadata: Metadata = {
  title: { absolute: 'Convite Lote Fundador | Loud Fit' },
  description:
    'Uma condição pensada para quem entra desde o começo. Convite exclusivo do Lote Fundador Loud Fit.',
  alternates: { canonical: '/founder' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: 'Convite Lote Fundador | Loud Fit',
    description:
      'Uma condição pensada para quem entra desde o começo.',
    url: '/founder',
    images: ['/opengraph-image'],
  },
}

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${founderDisplay.variable} ${founderBody.variable} founder-scope`}
      style={{ fontFamily: 'var(--font-founder-body), Archivo, system-ui, sans-serif' }}
    >
      {children}
    </div>
  )
}
