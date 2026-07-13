import { z } from 'zod'

const leadSchema = z.object({
  nome: z.string().trim().min(2),
  whatsapp: z.string().trim().min(10),
  email: z.string().trim().email().or(z.literal('')).optional(),
  unit_id: z.string().trim().min(1),
  unit_name: z.string().trim().min(1),
  plan_id: z.string().trim().min(1),
  plan_name: z.string().trim().min(1),
  regular_price: z.number(),
  first_month_price: z.number().optional(),
  source: z.string().trim().min(1).default('campaign_lead'),
  campaign: z.string().trim().min(1),
  campaign_audience: z.enum(['new_customer', 'reactivation']).optional(),
  page_url: z.string().trim().optional(),
  consent: z.literal(true),
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

  const webhookUrl =
    process.env.FOUNDER_LEAD_WEBHOOK_URL ?? process.env.FRANCHISE_LEAD_WEBHOOK_URL

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
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

  // Sem destino configurado: aceitar o envio para a apresentação aos sócios,
  // devolvendo ok para não bloquear a demonstração. A equipe recebe o interesse
  // pelo canal alternativo quando o webhook não estiver disponível.
  return Response.json({ ok: true, destination: 'noop' })
}
