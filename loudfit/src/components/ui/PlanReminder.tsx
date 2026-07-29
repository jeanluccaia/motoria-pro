'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PLAN_NAMES } from '@/lib/plans'

interface PlanReminderProps {
  isIpiranga?: boolean
}

function PlanReminderInner({ isIpiranga }: PlanReminderProps) {
  const params = useSearchParams()
  const plano = params.get('plano')
  const planName = plano ? PLAN_NAMES[plano] : null

  if (!planName) return null

  const isPowerPlus = plano === 'power-plus'
  const monthlyPrice = isIpiranga ? 'R$ 179,90' : 'R$ 119,90'

  return (
    <div className="mb-6 border-l-4 border-lf-volt bg-lf-volt/5 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lf-volt">
        Plano selecionado
      </p>
      <p className="mt-1 text-lg font-black text-gray-900">{planName}</p>
      {isPowerPlus ? (
        <p className="mt-1 text-sm text-gray-500">
          Primeira mensalidade por R$ 9,90 — depois {monthlyPrice}/mês no cartão. Fidelidade de 12 meses.
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          Selecione este plano no checkout abaixo para confirmar.
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
