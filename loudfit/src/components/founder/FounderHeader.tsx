import Link from 'next/link'
import Image from 'next/image'

export function FounderHeader() {
  return (
    <header className="relative z-30 border-b border-white/[0.10] bg-[#070707]">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-5 py-4 sm:px-8 md:py-5 lg:px-12">
        <Link href="/founder" aria-label="Loud Fit — Convite Lote Fundador" className="inline-flex">
          <Image
            src="/assets/images/loudfit-logo-official-lockup-yellow.png"
            alt="Loud Fit"
            width={124}
            height={36}
            className="h-auto w-[110px] object-contain sm:w-[124px]"
            priority
          />
        </Link>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/45 sm:text-[10px]"
          style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
        >
          Convite Lote Fundador
        </span>
      </div>
    </header>
  )
}
