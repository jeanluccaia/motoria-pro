'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { trackCampaignEvent } from '@/lib/campaign-analytics'
import type { CampaignPageConfig, CampaignPlan } from '@/lib/campaigns'
import { founderUnits } from '@/lib/founder-units'

const schema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome'),
  whatsapp: z.string().trim().min(14, 'Informe um WhatsApp válido'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Informe um e-mail válido',
    }),
  unit_id: z.string().trim().min(1, 'Escolha uma unidade'),
  consent: z.literal(true, { message: 'Aceite necessário para envio' }),
})

type FormData = z.infer<typeof schema>

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function readUtms() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const utms: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = params.get(key)
    if (val) utms[key] = val
  }
  return utms
}

interface CampaignFormProps {
  config: CampaignPageConfig
  plan: CampaignPlan
}

export function FounderForm({ config, plan }: CampaignFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [utms, setUtms] = useState<Record<string, string>>({})
  const startedRef = useRef(false)

  const availableUnits =
    config.unitIds && config.unitIds.length > 0
      ? founderUnits.filter((u) => config.unitIds!.includes(u.id))
      : founderUnits
  const singleUnit = availableUnits.length === 1 ? availableUnits[0] : null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nome: '',
      whatsapp: '',
      email: '',
      unit_id: singleUnit?.id ?? '',
      consent: false as unknown as true,
    },
  })

  const consent = watch('consent')

  useEffect(() => {
    setUtms(readUtms())
  }, [])

  function reportStart() {
    if (startedRef.current) return
    startedRef.current = true
    trackCampaignEvent(config.tracking.formStart, config.audience, {
      campaign_id: config.campaignId,
    })
  }

  const nameField = register('nome', { onChange: reportStart })

  const whatsField = register('whatsapp', {
    onChange: (e) => {
      reportStart()
      e.target.value = maskPhone(e.target.value)
    },
  })

  async function onSubmit(data: FormData) {
    if (submitting) return
    setSubmitting(true)
    setErrorMsg('')
    trackCampaignEvent(config.tracking.formSubmit, config.audience, {
      campaign_id: config.campaignId,
      plan_name: plan.name,
      regular_price: plan.regularPriceValue,
      first_month_price: plan.firstMonthPriceValue,
    })

    try {
      const unit = availableUnits.find((u) => u.id === data.unit_id)
      const response = await fetch('/api/founder-leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          whatsapp: data.whatsapp,
          email: data.email ?? '',
          unit_id: data.unit_id,
          unit_name: unit?.label ?? data.unit_id,
          plan_id: plan.id,
          plan_name: plan.name,
          regular_price: plan.regularPriceValue,
          first_month_price: plan.firstMonthPriceValue,
          source: config.leadSource,
          campaign: config.campaignId,
          campaign_audience: config.audience,
          page_url: typeof window !== 'undefined' ? window.location.href : undefined,
          consent: true,
          ...utms,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Erro ao enviar interesse.')
      }

      setSubmitted(true)
      trackCampaignEvent(config.tracking.formSuccess, config.audience, {
        campaign_id: config.campaignId,
        plan_name: plan.name,
        first_month_price: plan.firstMonthPriceValue,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar interesse.'
      setErrorMsg(message)
      trackCampaignEvent(config.tracking.formError, config.audience, {
        campaign_id: config.campaignId,
        message,
      })
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (submitted && typeof document !== 'undefined') {
      const el = document.getElementById('campaign-success')
      if (el) el.focus()
    }
  }, [submitted])

  if (submitted) {
    return (
      <div
        id="campaign-success"
        role="status"
        tabIndex={-1}
        className="w-full max-w-[420px] rounded-2xl border p-7 text-left focus:outline-none focus:ring-2 focus:ring-[#FFE000]/60 sm:p-8"
        style={{
          borderColor: 'rgba(255,224,0,0.3)',
          background: 'rgba(255,224,0,0.06)',
          fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
          animation: 'lfFounderFade 0.35s ease both',
        }}
      >
        <div
          className="uppercase"
          style={{
            fontFamily: 'var(--font-founder-display), Anton, sans-serif',
            color: '#FFE000',
            fontSize: 'clamp(22px, 3.2vw, 30px)',
            lineHeight: 1,
            marginBottom: 10,
          }}
        >
          {config.successTitle}
        </div>
        <p className="text-[14px] leading-[1.55] text-white/70">
          {config.successMessage}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-[420px] flex-col gap-3.5 text-left"
      style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
      noValidate
      aria-describedby="campaign-form-plan"
    >
      <div>
        <label htmlFor="campaign-nome" className="sr-only">
          Nome
        </label>
        <input
          id="campaign-nome"
          autoComplete="name"
          placeholder="Nome"
          aria-invalid={!!errors.nome}
          {...nameField}
          className="w-full rounded-[10px] border bg-white/[0.04] px-4 py-4 text-[15px] text-lf-text outline-none transition-colors placeholder:text-white/40 focus:border-[#FFE000]"
          style={{ borderColor: errors.nome ? '#B4231B' : 'rgba(244,244,242,0.13)' }}
        />
        {errors.nome && (
          <p role="alert" className="mt-1.5 text-[12px] text-[#F0665F]">
            {errors.nome.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="campaign-whats" className="sr-only">
          WhatsApp
        </label>
        <input
          id="campaign-whats"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="WhatsApp"
          aria-invalid={!!errors.whatsapp}
          {...whatsField}
          className="w-full rounded-[10px] border bg-white/[0.04] px-4 py-4 text-[15px] text-lf-text outline-none transition-colors placeholder:text-white/40 focus:border-[#FFE000]"
          style={{ borderColor: errors.whatsapp ? '#B4231B' : 'rgba(244,244,242,0.13)' }}
        />
        {errors.whatsapp && (
          <p role="alert" className="mt-1.5 text-[12px] text-[#F0665F]">
            {errors.whatsapp.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="campaign-email" className="sr-only">
          E-mail (opcional)
        </label>
        <input
          id="campaign-email"
          type="email"
          autoComplete="email"
          placeholder="E-mail (opcional)"
          aria-invalid={!!errors.email}
          {...register('email')}
          className="w-full rounded-[10px] border bg-white/[0.04] px-4 py-4 text-[15px] text-lf-text outline-none transition-colors placeholder:text-white/40 focus:border-[#FFE000]"
          style={{ borderColor: errors.email ? '#B4231B' : 'rgba(244,244,242,0.13)' }}
        />
        {errors.email && (
          <p role="alert" className="mt-1.5 text-[12px] text-[#F0665F]">
            {errors.email.message}
          </p>
        )}
      </div>

      {singleUnit ? (
        <div
          className="flex items-center justify-between rounded-[10px] border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-white/55"
          aria-live="polite"
        >
          <span className="font-semibold">Unidade</span>
          <span className="font-bold text-lf-text">{singleUnit.label}</span>
          <input type="hidden" {...register('unit_id')} value={singleUnit.id} />
        </div>
      ) : (
        <div>
          <label htmlFor="campaign-unit" className="sr-only">
            Unidade Loud Fit
          </label>
          <select
            id="campaign-unit"
            aria-invalid={!!errors.unit_id}
            {...register('unit_id')}
            className="w-full rounded-[10px] border bg-white/[0.04] px-4 py-4 text-[15px] text-lf-text outline-none transition-colors focus:border-[#FFE000]"
            style={{ borderColor: errors.unit_id ? '#B4231B' : 'rgba(244,244,242,0.13)' }}
            defaultValue=""
          >
            <option value="" disabled>
              Unidade Loud Fit
            </option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#111]">
                {u.label}
              </option>
            ))}
          </select>
          {errors.unit_id && (
            <p role="alert" className="mt-1.5 text-[12px] text-[#F0665F]">
              {errors.unit_id.message}
            </p>
          )}
        </div>
      )}

      <div
        id="campaign-form-plan"
        className="flex items-center justify-between rounded-[10px] border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-[12px] uppercase tracking-[0.12em] text-white/55"
      >
        <span className="font-semibold">Plano selecionado</span>
        <span className="font-bold text-lf-text">{plan.name}</span>
      </div>

      <label className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-white/60">
        <input
          type="checkbox"
          className="mt-[3px] h-4 w-4 shrink-0 accent-[#FFE000]"
          checked={!!consent}
          onChange={(e) =>
            setValue('consent', e.target.checked as unknown as true, { shouldValidate: true })
          }
        />
        <span>
          Concordo em compartilhar meus dados com a equipe da Loud Fit para atendimento. Leia a{' '}
          <Link
            href="/politica-de-privacidade"
            className="underline underline-offset-4 hover:text-white"
          >
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {errors.consent && (
        <p role="alert" className="text-[12px] text-[#F0665F]">
          {errors.consent.message}
        </p>
      )}

      {errorMsg && (
        <p role="alert" className="text-[12.5px] text-[#F0665F]">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={
          'lf-cta-volt mt-1 inline-flex min-h-[54px] items-center justify-center rounded-[10px] px-6 py-4 text-[13.5px] font-black uppercase tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(255,224,0,0.24)] active:translate-y-0 disabled:cursor-wait disabled:opacity-70 sm:text-[14px] ' +
          (submitting ? '' : 'lf-cta-pulse')
        }
      >
        {submitting ? 'ENVIANDO…' : config.formCtaLabel}
      </button>
    </form>
  )
}
