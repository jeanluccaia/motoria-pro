'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PLAN_NAMES } from '@/lib/plans'

interface PlanReminderProps {
  isIpiranga?: boolean
}

const STANDARD_PRICES: Record<string, string> = {
  'power-trimestral': 'R$ 99',
  'power-recorrente': 'R$ 139,90',
  'power-plus': 'R$ 119,00',
  'power': 'R$ 149,00',
}

const IPIRANGA_PRICES: Record<string, string> = {
  'power-trimestral': 'R$ 139',
  'power-recorrente': 'R$ 189,00',
  'power-plus': 'R$ 179,90',
  'power': 'R$ 199,90',
}

const TRIMESTRAL_TOTAL: Record<'standard' | 'ipiranga', { total: string; installment: string }> = {
  standard: { total: 'R$ 297', installment: '3× de R$ 99' },
  ipiranga: { total: 'R$ 417', installment: '3× de R$ 139' },
}

function PlanReminderInner({ isIpiranga }: PlanReminderProps) {
  const params = useSearchParams()
  const plano = params.get('plano')
  const planName = plano ? PLAN_NAMES[plano] : null

  if (!plano || !planName) return null

  const prices = isIpiranga ? IPIRANGA_PRICES : STANDARD_PRICES
  const monthlyPrice = prices[plano]
  const trimestral = isIpiranga ? TRIMESTRAL_TOTAL.ipiranga : TRIMESTRAL_TOTAL.standard

  return (
    <div className="mb-6 border-l-4 border-lf-volt bg-lf-volt/5 px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lf-volt">
        Plano selecionado
      </p>
      <p className="mt-1 text-lg font-black text-gray-900">{planName}</p>
      {plano === 'power-trimestral' && monthlyPrice && (
        <p className="mt-1 text-sm text-gray-500">
          3 meses de treino por {monthlyPrice}/mês — total {trimestral.total}. À vista ou em {trimestral.installment}. Camiseta Loud Fit de presente na retirada.
        </p>
      )}
      {plano === 'power-recorrente' && monthlyPrice && (
        <p className="mt-1 text-sm text-gray-500">
          Mensalidade de {monthlyPrice}/mês no cartão. Sem fidelidade — cancele sem multa.
        </p>
      )}
      {plano === 'power-plus' && monthlyPrice && (
        <p className="mt-1 text-sm text-gray-500">
          1º mês por R$ 0,00 — taxa de inscrição R$ 0,00. Depois {monthlyPrice}/mês no cartão. Fidelidade de 12 meses.
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
