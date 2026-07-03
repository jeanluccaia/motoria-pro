'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PLAN_NAMES } from '@/lib/plans'

function PlanChipInner() {
  const params = useSearchParams()
  const plano = params.get('plano')
  const planName = plano ? PLAN_NAMES[plano] : null

  if (!planName) return null

  return (
    <div className="mb-6 flex items-center gap-3 border border-lf-volt/30 bg-lf-volt/5 px-4 py-3">
      <span className="h-2 w-2 shrink-0 rounded-full bg-lf-volt" />
      <p className="text-sm text-gray-700">
        Plano selecionado: <strong>{planName}</strong>
      </p>
      <Link
        href="/unidades"
        className="ml-auto text-xs uppercase tracking-wider text-gray-400 underline-offset-2 hover:text-gray-700 hover:underline"
      >
        Trocar
      </Link>
    </div>
  )
}

export function PlanChip() {
  return (
    <Suspense>
      <PlanChipInner />
    </Suspense>
  )
}
