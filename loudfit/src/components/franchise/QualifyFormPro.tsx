'use client'

import { useEffect, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  brazilianStates,
  capitalRanges,
  investmentTimeframes,
  managementExperience,
  successCopy,
} from '@/lib/franchise'
import { trackFranchiseEvent } from '@/lib/franchise-analytics'

const stepOneSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome completo'),
  whatsapp: z.string().trim().min(10, 'Informe um WhatsApp válido'),
  email: z.string().trim().email('Informe um e-mail válido'),
  cidade_interesse: z.string().trim().min(2, 'Informe a cidade de interesse'),
  estado: z.string().trim().length(2, 'Selecione o estado'),
})

const stepTwoSchema = z.object({
  capital_disponivel: z.string().min(1, 'Selecione uma faixa'),
  prazo_investimento: z.enum(['agora', '3m', '6m', '6m+']),
  ja_tem_ponto: z.boolean(),
  experiencia: z.string().min(1, 'Selecione uma opção'),
  mensagem: z.string().max(500, 'Máximo de 500 caracteres').optional(),
  consentimento: z.literal(true, { message: 'Aceite necessário para envio' }),
})

const schema = stepOneSchema.merge(stepTwoSchema)
type FormData = z.infer<typeof schema>

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

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const labelCls = 'block text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]'
const inputCls =
  'mt-2 w-full border border-[#0B0B0C]/20 bg-white px-4 py-3 text-[15px] leading-[1.4] text-[#0B0B0C] transition-colors placeholder:text-[#0B0B0C]/35 focus:border-[#0B0B0C] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,224,0,0.4)]'
const errorCls = 'mt-1.5 text-xs text-[#B4231B]'

export function QualifyFormPro() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [utms, setUtms] = useState<Record<string, string>>({})

  useEffect(() => {
    setUtms(readUtms())
    trackFranchiseEvent('franchise_form_view')
  }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nome: '',
      whatsapp: '',
      email: '',
      cidade_interesse: '',
      estado: '',
      capital_disponivel: '',
      prazo_investimento: '3m',
      ja_tem_ponto: false,
      experiencia: '',
      mensagem: '',
      consentimento: false as unknown as true,
    },
  })

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = form

  async function advance() {
    const valid = await trigger(['nome', 'whatsapp', 'email', 'cidade_interesse', 'estado'])
    if (!valid) {
      const stepErrors = errors as FieldErrors<FormData>
      trackFranchiseEvent('franchise_form_error', {
        step: 1,
        first_field: Object.keys(stepErrors)[0] ?? 'desconhecido',
      })
      return
    }
    setStep(2)
    trackFranchiseEvent('franchise_form_step2')
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      const payload = {
        nome: data.nome,
        whatsapp: data.whatsapp,
        email: data.email,
        cidade_interesse: `${data.cidade_interesse} - ${data.estado}`,
        capital_disponivel: data.capital_disponivel,
        ja_tem_ponto: data.ja_tem_ponto,
        prazo_investimento: data.prazo_investimento === '6m' ? '6m+' : data.prazo_investimento,
        origem: `/franquias${typeof window !== 'undefined' && window.location.search ? window.location.search : ''}`,
        // Extras persisted for the CRM/webhook side; ignored if the API validator rejects extras.
        experiencia: data.experiencia,
        mensagem: data.mensagem,
        submitted_page: '/franquias',
        submitted_at: new Date().toISOString(),
        ...utms,
      }
      const response = await fetch('/api/franquia-leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Erro ao enviar candidatura.')
      }
      trackFranchiseEvent('franchise_lead', {
        capital: data.capital_disponivel,
        prazo: data.prazo_investimento,
        experiencia: data.experiencia,
      })
      router.push('/obrigado')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar candidatura.'
      setError(message)
      setLoading(false)
      trackFranchiseEvent('franchise_form_error', { step: 2, message })
    }
  }

  const jaTemPonto = watch('ja_tem_ponto')
  const consentimento = watch('consentimento')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative flex flex-col gap-6 border border-[#0B0B0C]/12 bg-white p-6 shadow-[0_20px_60px_rgba(11,11,12,0.08)] md:p-9 lg:p-11"
      noValidate
      aria-describedby="candidatura-hint"
    >
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a4a4f]">
          <span>Etapa {step} de 2</span>
          <span>{step === 1 ? 'Dados e região' : 'Perfil'}</span>
        </div>
        <div className="mt-3 h-1 w-full bg-[#0B0B0C]/12">
          <div
            className="h-full bg-lf-volt transition-[width] duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="nome" className={labelCls}>Nome completo</label>
            <input
              id="nome"
              autoComplete="name"
              placeholder="Seu nome completo"
              className={inputCls}
              aria-invalid={!!errors.nome}
              {...register('nome')}
            />
            {errors.nome && <p role="alert" className={errorCls}>{errors.nome.message}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className={labelCls}>WhatsApp</label>
              <input
                id="whatsapp"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(11) 99999-9999"
                className={inputCls}
                aria-invalid={!!errors.whatsapp}
                {...register('whatsapp', {
                  onChange: (e) => (e.target.value = maskPhone(e.target.value)),
                })}
              />
              {errors.whatsapp && <p role="alert" className={errorCls}>{errors.whatsapp.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className={inputCls}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p role="alert" className={errorCls}>{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <div>
              <label htmlFor="cidade" className={labelCls}>Cidade de interesse</label>
              <input
                id="cidade"
                autoComplete="address-level2"
                placeholder="Ex: Campinas"
                className={inputCls}
                aria-invalid={!!errors.cidade_interesse}
                {...register('cidade_interesse')}
              />
              {errors.cidade_interesse && <p role="alert" className={errorCls}>{errors.cidade_interesse.message}</p>}
            </div>
            <div>
              <label htmlFor="estado" className={labelCls}>Estado</label>
              <select
                id="estado"
                autoComplete="address-level1"
                className={inputCls}
                aria-invalid={!!errors.estado}
                {...register('estado')}
              >
                <option value="">Selecione</option>
                {brazilianStates.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              {errors.estado && <p role="alert" className={errorCls}>{errors.estado.message}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={advance}
            className="lf-cta-volt mt-1 inline-flex min-h-[52px] items-center justify-center px-8 py-4 text-sm font-black uppercase tracking-[0.12em] transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="capital" className={labelCls}>Capital disponível</label>
            <select
              id="capital"
              className={inputCls}
              aria-invalid={!!errors.capital_disponivel}
              {...register('capital_disponivel')}
            >
              <option value="">Selecione</option>
              {capitalRanges.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            {errors.capital_disponivel && <p role="alert" className={errorCls}>{errors.capital_disponivel.message}</p>}
          </div>

          <div>
            <span className={labelCls}>Prazo para investir</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {investmentTimeframes.map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only peer"
                    {...register('prazo_investimento')}
                  />
                  <span className="block border border-[#0B0B0C]/20 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B0B0C]/80 peer-checked:border-[#0B0B0C] peer-checked:bg-[#0B0B0C] peer-checked:text-white">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className={labelCls}>Experiência em gestão</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {managementExperience.map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only peer"
                    {...register('experiencia')}
                  />
                  <span className="block border border-[#0B0B0C]/20 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B0B0C]/80 peer-checked:border-[#0B0B0C] peer-checked:bg-[#0B0B0C] peer-checked:text-white">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.experiencia && <p role="alert" className={errorCls}>{errors.experiencia.message}</p>}
          </div>

          <label className="flex items-start gap-3 border border-[#0B0B0C]/12 bg-[#F6F5F1] px-4 py-3 text-sm text-[#0B0B0C]">
            <input
              type="checkbox"
              className="mt-[3px] h-4 w-4 accent-[#0B0B0C]"
              checked={jaTemPonto}
              onChange={(e) => setValue('ja_tem_ponto', e.target.checked, { shouldDirty: true })}
            />
            <span>Já tenho um ponto comercial em vista.</span>
          </label>

          <div>
            <label htmlFor="mensagem" className={labelCls}>Mensagem (opcional)</label>
            <textarea
              id="mensagem"
              rows={3}
              placeholder="Conte um pouco sobre seu momento e sua praça."
              className={inputCls + ' resize-y'}
              {...register('mensagem')}
            />
            {errors.mensagem && <p role="alert" className={errorCls}>{errors.mensagem.message}</p>}
          </div>

          <label className="flex items-start gap-3 text-[13px] leading-[1.55] text-[#3f3f42]">
            <input
              type="checkbox"
              className="mt-[3px] h-4 w-4 shrink-0 accent-[#0B0B0C]"
              checked={!!consentimento}
              onChange={(e) => setValue('consentimento', e.target.checked as unknown as true, { shouldValidate: true })}
            />
            <span>
              Concordo em compartilhar meus dados com o time de expansão Loud Fit para análise de candidatura. Leia a{' '}
              <a href="/politica-de-privacidade" className="underline underline-offset-4 hover:text-[#0B0B0C]">
                política de privacidade
              </a>.
            </span>
          </label>
          {errors.consentimento && <p role="alert" className={errorCls}>{errors.consentimento.message}</p>}

          {error && (
            <div role="alert" className="border border-[#B4231B]/30 bg-[#B4231B]/8 p-3 text-sm text-[#B4231B]">
              {error}
            </div>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-[52px] items-center justify-center border border-[#0B0B0C]/25 px-6 py-4 text-[12px] font-black uppercase tracking-[0.14em] text-[#0B0B0C] transition-colors hover:border-[#0B0B0C] sm:min-w-[140px]"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="lf-cta-volt inline-flex min-h-[52px] flex-1 items-center justify-center px-8 py-4 text-sm font-black uppercase tracking-[0.12em] transition-all hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-wait"
            >
              {loading ? 'Enviando…' : 'Enviar candidatura'}
            </button>
          </div>
        </div>
      )}

      <p id="candidatura-hint" className="text-[12px] leading-[1.55] text-[#4a4a4f]">
        {successCopy()}
      </p>
    </form>
  )
}
