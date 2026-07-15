'use client'

import { useEffect, useState } from 'react'
import {
  CAMPAIGN_END_MS,
  CAMPAIGN_START_MS,
  computeCountdown,
} from '@/lib/campaign-countdown'

const STATIC_LABEL = 'OFERTA DE INAUGURAÇÃO ATÉ 31 DE JULHO'

function formatDynamic(state: ReturnType<typeof computeCountdown>): string {
  if (state.status === 'ended') return 'OFERTA ENCERRADA'
  if (state.status === 'not_started') return 'A OFERTA COMEÇA EM BREVE'
  if (state.status === 'last_hour') return 'ÚLTIMOS MINUTOS DA OFERTA'
  if (state.status === 'last_day') return 'TERMINA HOJE'
  const hoursLabel = state.hours === 1 ? 'HORA' : 'HORAS'
  const daysLabel = state.days === 1 ? 'DIA' : 'DIAS'
  return `FALTAM ${state.days} ${daysLabel} E ${state.hours} ${hoursLabel}`
}

export function CampaignCountdownBar() {
  const [state, setState] = useState(() => ({
    initial: true,
    ...computeCountdown(CAMPAIGN_START_MS),
  }))

  useEffect(() => {
    function tick() {
      setState({ initial: false, ...computeCountdown(Date.now()) })
    }
    tick()
    const interval = window.setInterval(tick, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const dynamic = state.initial ? '' : formatDynamic(state)
  const progressPct = Math.min(100, Math.max(0, state.progress * 100))
  const ended = state.status === 'ended'

  return (
    <div
      className="relative w-full bg-[#FFE000] text-[#0A0A0A]"
      role="region"
      aria-label="Prazo da oferta de inauguração"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        animation: 'lfCountdownIn 0.5s cubic-bezier(0.2,0.7,0.2,1) both',
      }}
    >
      <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-1 px-4 py-2 text-center sm:flex-row sm:justify-center sm:gap-6 sm:py-2.5 sm:px-8">
        <span className="text-[10.5px] font-black uppercase tracking-[0.14em] sm:text-[11.5px]">
          {STATIC_LABEL}
        </span>
        {dynamic && (
          <>
            <span
              aria-hidden="true"
              className="hidden h-[10px] w-px bg-[#0A0A0A]/30 sm:inline-block"
            />
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] sm:text-[11.5px]"
              aria-live="polite"
            >
              {dynamic}
            </span>
          </>
        )}
      </div>

      <div
        aria-hidden="true"
        className="h-[3px] w-full bg-[#0A0A0A]/15"
      >
        <div
          className="h-full bg-[#0A0A0A] transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%`, opacity: ended ? 0.4 : 1 }}
        />
      </div>

      <span className="sr-only">
        Campanha válida entre{' '}
        {new Date(CAMPAIGN_START_MS).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        })}{' '}
        e{' '}
        {new Date(CAMPAIGN_END_MS).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        })}
        .
      </span>

      <style jsx>{`
        @keyframes lfCountdownIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[role='region'] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
