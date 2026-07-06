'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const ATENDIMENTO_NUM = '[NUMERO_WHATSAPP_ATENDIMENTO]'
const FRANQUIA_NUM = '[NUMERO_WHATSAPP_FRANQUIA]'

const options = [
  {
    label: 'Atendimento',
    desc: 'Dúvidas sobre planos e unidades',
    href: `https://wa.me/${ATENDIMENTO_NUM}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre a LoudFit.')}`,
  },
  {
    label: 'Seja franqueado',
    desc: 'Quero abrir uma unidade',
    href: `https://wa.me/${FRANQUIA_NUM}?text=${encodeURIComponent('Olá! Tenho interesse em ser franqueado LoudFit.')}`,
  },
]

export function WhatsAppFloat() {
  const [open, setOpen] = useState(false)
  const [scrolledPastHero, setScrolledPastHero] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed z-40 flex flex-col items-end gap-3 transition-all duration-300',
        'bottom-4 right-4 md:bottom-6 md:right-6',
        scrolledPastHero
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100',
      )}
    >

      {/* Menu expandido */}
      {open && (
        <div className="flex flex-col gap-2 items-end">
          {options.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border border-lf-line bg-lf-black/95 px-4 py-3 text-right backdrop-blur-sm transition-all duration-150 hover:border-lf-volt hover:bg-lf-graphite"
            >
              <div>
                <p className="text-xs font-bold text-lf-text">{opt.label}</p>
                <p className="text-[10px] text-lf-muted">{opt.desc}</p>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#25D366] text-white">
                <WhatsAppIcon />
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Botão principal — menor e mais discreto no mobile */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar WhatsApp' : 'Abrir WhatsApp'}
        className="flex h-[52px] w-[52px] items-center justify-center bg-[#111111] text-[#25D366] shadow-[0_4px_16px_rgba(0,0,0,0.30)] transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] md:h-[54px] md:w-[54px]"
      >
        {open ? <CloseIcon /> : <WhatsAppIcon size={18} />}
      </button>
    </div>
  )
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
