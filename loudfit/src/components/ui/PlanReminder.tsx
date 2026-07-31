'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PLAN_NAMES } from '@/lib/plans'

interface PlanReminderProps {
  isIpiranga?: boolean
}

const STANDARD_PRICES: Record<string, string> = {
  'power-plus': 'R$ 119,00',
  'power-recorrente': 'R$ 139,00',
  'power': 'R$ 149,00',
}

const IPIRANGA_PRICES: Record<string, string> = {
  'power-plus': 'R$ 179,90',
  'power-recorrente': 'R$ 189,00',
  'power': 'R$ 199,90',
}

function PlanReminderInner({ isIpiranga }: PlanReminderProps) {
  const params = useSearchParams()
  const plano = params.get('plano')
  const planName = plano ? PLAN_NAMES[plano] : null

  if (!plano || !planName) return null

  const prices = isIpiranga ? IPIRANGA_PRICES : STANDARD_PRICES
  const monthlyPrice = prices[plano]

  return (
    <div className="mb-6 border-l-4 border-lf-volt bg-lf-volt/5 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lf-volt">
        Plano selecionado
      </p>
      <p className="mt-1 text-lg font-black text-gray-900">{planName}</p>
      {plano === 'power-plus' && monthlyPrice && (
        <p className="mt-1 text-sm text-gray-500">
          Primeira mensalidade por R$ 9,90 — depois {monthlyPrice}/mês no cartão. Fidelidade de 12 meses.
        </p>
      )}
      {plano === 'power-recorrente' && monthlyPrice && (
        <p className="mt-1 text-sm text-gray-500">
          Mensalidade recorrente de {monthlyPrice}. Sem fidelidade — cancelamento com aviso prévio de 30 dias.
        </p>
      )}
      {plano === 'power' && monthlyPrice && (
        <p className="mt-1 text-sm text-gray-500">
          Mensalidade de {monthlyPrice}. Sem compromisso — pagamento mensal na unidade.
        </p>
      )}
    </div>
  )
}

export function PlanReminder({ isIpiranga }: PlanReminderProps) {
  return (
    <Suspense>
      <PlanReminderInner isIpiranga={isIpiranga} />
    </Suspense>
  )
}
