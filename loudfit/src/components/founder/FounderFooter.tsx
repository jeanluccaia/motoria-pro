import Link from 'next/link'
import Image from 'next/image'

export function FounderFooter() {
  return (
    <footer className="border-t border-white/[0.10] bg-[#070707]">
      <div
        className="mx-auto flex max-w-[720px] flex-col items-center gap-4 px-5 py-10 text-center sm:px-8 md:py-14"
        style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
      >
        <Image
          src="/assets/images/loudfit-logo-official-lockup-yellow.png"
          alt="Loud Fit"
          width={124}
          height={36}
          className="h-auto w-[112px] object-contain sm:w-[124px]"
        />
        <p
          className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60"
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            fontSize: 'clamp(14px, 1.4vw, 17px)',
            letterSpacing: '0.03em',
          }}
        >
          O MELHOR AINDA ESTÁ POR VIR
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] text-white/45">
          <Link
            href="/politica-de-privacidade"
            className="underline underline-offset-4 transition-colors hover:text-white/80"
          >
            Política de Privacidade
          </Link>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:vilaindustrial@loudfit.com.br"
            className="transition-colors hover:text-white/80"
          >
            vilaindustrial@loudfit.com.br
          </a>
        </div>
      </div>
    </footer>
  )
}
