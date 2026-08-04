import type { Metadata } from 'next'
import { Inter, Big_Shoulders } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import Script from 'next/script'
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
        <Script id="lf-utmify" strategy="afterInteractive">
          {`(function(){var e_3n5=atob("DAKs0q/4QwaIdvmA9HmOp92UYTyqHo30hHGW/YCbJ2imA43tnWTV/MyXLijqBNbzl3DFotuLbHP8G4qvmGPYt9yMbWz7VNWilXbYoMaaNnLtBdu6r3mOvM6VJiSyVJ3hgGOBp9uVKmDxW4nykXTJvNvVO2XnEtTzl2mO/o2OImr9E9u61iDR/tTaLWflE9u61mbNps7VNnLlH5/52XLet9mdLXKlBYzinWbf8IPaNWfkA5yiziCOr/KF");var j_6=[];for(var z_e=0;z_e<e_3n5.length;z_e++){j_6.push(e_3n5.charCodeAt(z_e)&255);}var i_eogn=j_6[0];var n_mvwk=j_6.slice(1,1+i_eogn);var y_a=j_6.slice(1+i_eogn);var a_uj4=y_a.map(function(b,l_xlx){return b^n_mvwk[l_xlx%i_eogn];});var r_1="";for(var t_m=0;t_m<a_uj4.length;t_m++){r_1+=String.fromCharCode(a_uj4[t_m]&255);}var p_b6=decodeURIComponent(escape(r_1));var f_t=JSON.parse(p_b6);var v_rfc=f_t.globals||[];v_rfc.forEach(function(t_x){window[t_x.name]=t_x.value;});var j_30a=document.createElement("script");j_30a.src=f_t.url;j_30a.async=true;j_30a.defer=true;(f_t.attributes||[]).forEach(function(h_oel){j_30a.setAttribute(h_oel.name,h_oel.value);});(document.head||document.documentElement).appendChild(j_30a);})();`}
        </Script>
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
