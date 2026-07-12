import { z } from 'zod'
import { submitLeadFranquia } from '@/lib/supabase'

const leadSchema = z.object({
  nome: z.string().trim().min(2),
  whatsapp: z.string().trim().min(10),
  email: z.string().trim().email(),
  cidade_interesse: z.string().trim().min(2),
  capital_disponivel: z.string().trim().min(1),
  ja_tem_ponto: z.boolean(),
  prazo_investimento: z.enum(['agora', '3m', '6m+']),
  origem: z.string().trim().min(1).default('direto'),

  // Optional metadata carried by the premium franchise form. Forwarded to
  // the webhook when set; stripped before the Supabase insert to keep the
  // existing table schema unchanged.
  experiencia: z.string().trim().optional(),
  mensagem: z.string().trim().max(500).optional(),
  submitted_page: z.string().trim().optional(),
  submitted_at: z.string().trim().optional(),
  utm_source: z.string().trim().optional(),
  utm_medium: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional(),
  utm_term: z.string().trim().optional(),
  utm_content: z.string().trim().optional(),
})

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const webhookUrl = process.env.FRANCHISE_LEAD_WEBHOOK_URL

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          source: 'loudfit-site',
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        return Response.json({ error: 'Destino do lead recusou o envio.' }, { status: 502 })
      }

      return Response.json({ ok: true, destination: 'webhook' })
    } catch {
      return Response.json({ error: 'Falha ao enviar para o webhook.' }, { status: 502 })
    }
  }

  try {
    const {
      nome,
      whatsapp,
      email,
      cidade_interesse,
      capital_disponivel,
      ja_tem_ponto,
      prazo_investimento,
      origem,
    } = parsed.data
    await submitLeadFranquia({
      nome,
      whatsapp,
      email,
      cidade_interesse,
      capital_disponivel,
      ja_tem_ponto,
      prazo_investimento,
      origem,
    })
    return Response.json({ ok: true, destination: 'supabase' })
  } catch {
    return Response.json(
      { error: 'Envio automático não configurado. Use o contato direto.' },
      { status: 503 },
    )
  }
}
