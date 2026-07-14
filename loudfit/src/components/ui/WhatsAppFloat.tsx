'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const units = [
  { name: 'Carrefour Valinhos', slug: 'carrefour-valinhos', href: 'https://wa.me/5519994410440' },
  { name: 'Vila Industrial',    slug: 'vila-industrial',    href: 'https://wa.me/5519988291946' },
  { name: 'Amoreiras',          slug: 'amoreiras',          href: 'https://wa.me/5519998554252' },
  { name: 'Anchieta SP',        slug: 'anchieta-sp',        href: 'https://wa.me/5511992989496' },
  { name: 'Mogi Mirim',         slug: 'mogi-mirim',         href: 'https://wa.me/5519991429998' },
  { name: 'Ipiranga',           slug: 'ipiranga',           href: 'https://wa.me/5511937334895' },
]

export function WhatsAppFloat() {
  const [open, setOpen] = useState(false)
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onScroll() {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    function onClickOut(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [open])

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'fixed z-40 flex flex-col items-end gap-2 transition-all duration-300',
        'bottom-4 right-4 md:bottom-6 md:right-6',
        scrolledPastHero
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100',
      )}
    >

      {/* Painel flutuante */}
      {open && (
        <div
          className="overflow-y-auto rounded-[20px] border border-white/10 bg-[#0f0f0f] shadow-[0_8px_40px_rgba(0,0,0,0.60)]"
          style={{
            width: 'min(340px, calc(100vw - 32px))',
            maxHeight: 'min(530px, calc(100svh - 100px))',
          }}
        >
          {/* Atendimento */}
          <div className="p-4">
            <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#25D366]">
              Atendimento
            </p>
            <p className="mb-3 text-[11px] leading-snug text-white/45">
              Escolha a unidade para falar no WhatsApp:
            </p>

            <div className="flex flex-col gap-1">
              {units.map((u) => (
                <a
                  key={u.name}
                  href={u.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent('whatsapp_click', { location: 'float', unit_slug: u.slug })
                    setOpen(false)
                  }}
                  className="flex items-center justify-between gap-3 rounded-[10px] bg-white/[0.05] px-3 py-2.5 transition-colors hover:bg-white/[0.10] active:bg-white/[0.08]"
                >
                  <span className="text-sm font-semibold leading-tight text-white">
                    {u.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#25D366]">
                    <WhatsAppIcon size={11} />
                    Falar
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div className="mx-4 border-t border-white/[0.07]" />

          {/* Seja franqueado */}
          <div className="p-4">
            <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
              Seja franqueado
            </p>
            <p className="mb-3 text-[11px] leading-snug text-white/40">
              Quero abrir uma unidade
            </p>
            <Link
              href="/franquias#formulario"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.10] px-3 py-2.5 transition-colors hover:border-white/[0.20] hover:bg-white/[0.04]"
            >
              <span className="text-sm font-semibold text-white/80">
                Ir para o formulário
              </span>
              <span className="text-xs text-white/35">→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Botão redondo */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar menu' : 'Contato via WhatsApp'}
        className={cn(
          'flex h-[54px] w-[54px] items-center justify-center rounded-full',
          'shadow-[0_4px_20px_rgba(0,0,0,0.40)] transition-all duration-200',
          'hover:scale-105 active:scale-95',
          open
            ? 'bg-white/[0.12] text-white/80'
            : 'bg-[#1a1a1a] text-[#25D366]',
        )}
      >
        {open ? <CloseIcon /> : <WhatsAppIcon size={22} />}
      </button>
    </div>
  )
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
