'use client'

import Script from 'next/script'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
  type ConsentState,
} from '@/lib/consent'
import { trackPageView } from '@/lib/analytics'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Carrega tags de terceiros somente após consentimento válido.
 * - GA4 depende de consent.analytics + NEXT_PUBLIC_GA4_ID
 * - Meta Pixel depende de consent.marketing + NEXT_PUBLIC_META_PIXEL_ID
 *
 * O primeiro page_view do GA4 é feito automaticamente pelo próprio snippet
 * (config no bootstrap). Em navegações client-side subsequentes, o
 * PageViewTracker abaixo emite o page_view manualmente sem duplicar.
 */

function useConsent(): ConsentState {
  return useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  )
}

/**
 * Tracker de page_view em navegação SPA. O primeiro page_view é enviado pelo
 * snippet do GA4 no boot; aqui só emitimos nos pathname changes seguintes.
 * Usamos ref (não state) pra rastrear a primeira execução, evitando o
 * react-hooks/set-state-in-effect.
 */
function PageViewTracker() {
  const pathname = usePathname()
  const search = useSearchParams()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const query = search?.toString()
    const url = query ? `${pathname}?${query}` : pathname
    if (url) trackPageView(url)
  }, [pathname, search])

  return null
}

export function AnalyticsScripts() {
  const consent = useConsent()
  const gaId = process.env.NEXT_PUBLIC_GA4_ID
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  return (
    <>
      {consent.analytics && gaId ? (
        <>
          <Script
            id="lf-ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="lf-ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: true, anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {consent.marketing && metaId ? (
        <Script id="lf-meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaId}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}

      <PageViewTracker />
    </>
  )
}
