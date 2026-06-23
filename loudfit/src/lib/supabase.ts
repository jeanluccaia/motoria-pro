import { createClient } from '@supabase/supabase-js'
import type { Unit, Testimonial } from '@/types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function getClient() {
  if (!url || url.includes('[') || !anonKey || anonKey.includes('[')) return null
  return createClient(url, anonKey)
}

export async function getUnits(): Promise<Unit[]> {
  const db = getClient()
  if (!db) return []
  const { data, error } = await db.from('units').select('*').order('ordem')
  if (error) throw error
  return data as Unit[]
}

export async function getUnitBySlug(slug: string): Promise<Unit | null> {
  const db = getClient()
  if (!db) return null
  const { data, error } = await db.from('units').select('*').eq('slug', slug).single()
  if (error) return null
  return data as Unit
}

export async function getTestimonials(tipo?: string): Promise<Testimonial[]> {
  const db = getClient()
  if (!db) return []
  let query = db.from('depoimentos').select('*').eq('aprovado', true).eq('destaque', true)
  if (tipo) query = query.eq('tipo', tipo)
  const { data, error } = await query
  if (error) throw error
  return data as Testimonial[]
}

export async function submitLeadFranquia(lead: {
  nome: string
  whatsapp: string
  email: string
  cidade_interesse: string
  capital_disponivel: string
  ja_tem_ponto: boolean
  prazo_investimento: string
  origem: string
}) {
  const db = getClient()
  if (!db) throw new Error('Supabase não configurado')
  const { error } = await db.from('leads_franquia').insert([{ ...lead, status: 'novo' }])
  if (error) throw error
}
