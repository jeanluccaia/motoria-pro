'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { submitLeadFranquia } from '@/lib/supabase'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  whatsapp: z.string().min(10, 'WhatsApp obrigatório'),
  email: z.string().email('E-mail inválido'),
  cidade_interesse: z.string().min(2, 'Cidade obrigatória'),
  capital_disponivel: z.string().min(1, 'Selecione uma opção'),
  ja_tem_ponto: z.boolean(),
  prazo_investimento: z.enum(['agora', '3m', '6m+']),
})

type FormData = z.infer<typeof schema>

const inputCls =
  'w-full bg-lf-black border border-lf-line text-lf-text placeholder:text-lf-muted px-4 py-3 text-sm focus:outline-none focus:border-lf-volt transition-colors'
const labelCls = 'block text-xs uppercase tracking-widest text-lf-muted mb-2'
const errorCls = 'text-red-400 text-xs mt-1'

export function QualifyForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ja_tem_ponto: false, prazo_investimento: '3m' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    try {
      await submitLeadFranquia({
        ...data,
        origem: document.referrer || 'direto',
      })
      router.push('/obrigado')
    } catch {
      setError('Erro ao enviar. Tente novamente ou fale pelo WhatsApp.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl" id="formulario">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Nome completo</label>
          <input {...register('nome')} placeholder="Seu nome" className={inputCls} />
          {errors.nome && <p className={errorCls}>{errors.nome.message}</p>}
        </div>
        <div>
          <label className={labelCls}>WhatsApp</label>
          <input {...register('whatsapp')} placeholder="(11) 99999-9999" type="tel" className={inputCls} />
          {errors.whatsapp && <p className={errorCls}>{errors.whatsapp.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>E-mail</label>
        <input {...register('email')} placeholder="seu@email.com" type="email" className={inputCls} />
        {errors.email && <p className={errorCls}>{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Cidade de interesse</label>
        <input {...register('cidade_interesse')} placeholder="Ex: São Paulo – SP" className={inputCls} />
        {errors.cidade_interesse && <p className={errorCls}>{errors.cidade_interesse.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Capital disponível para investimento</label>
        <select {...register('capital_disponivel')} className={inputCls}>
          <option value="">Selecione</option>
          <option value="ate_200k">Até R$ 200 mil</option>
          <option value="200_400k">R$ 200 mil – R$ 400 mil</option>
          <option value="400_600k">R$ 400 mil – R$ 600 mil</option>
          <option value="acima_600k">Acima de R$ 600 mil</option>
        </select>
        {errors.capital_disponivel && <p className={errorCls}>{errors.capital_disponivel.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Prazo para investir</label>
        <div className="flex gap-3">
          {[
            { value: 'agora', label: 'Agora' },
            { value: '3m', label: 'Em 3 meses' },
            { value: '6m+', label: '6 meses ou mais' },
          ].map((opt) => (
            <label key={opt.value} className="flex-1 cursor-pointer">
              <input {...register('prazo_investimento')} type="radio" value={opt.value} className="sr-only peer" />
              <span className="block text-center text-xs uppercase tracking-widest px-3 py-3 border border-lf-line text-lf-muted peer-checked:border-lf-volt peer-checked:text-lf-volt transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input {...register('ja_tem_ponto')} type="checkbox" id="ponto" className="w-4 h-4 accent-[#F2E205]" />
        <label htmlFor="ponto" className="text-sm text-lf-muted">Já tenho um ponto comercial em vista</label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button type="submit" variant="volt" size="lg" className="w-full justify-center" disabled={loading}>
        {loading ? 'Enviando...' : 'Quero ser franqueado'}
      </Button>

      <p className="text-xs text-lf-muted">
        Seus dados são usados apenas para contato da equipe LoudFit. Nada de spam.
      </p>
    </form>
  )
}
