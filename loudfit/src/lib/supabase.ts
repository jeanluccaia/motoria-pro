import { createClient } from '@supabase/supabase-js'
import type { Unit, Testimonial } from '@/types'

const fallbackUnits: Unit[] = [
  {
    id: 'fallback-carrefour-valinhos',
    slug: 'carrefour-valinhos',
    nome: 'LoudFit Carrefour Valinhos',
    bairro: 'Carrefour Valinhos',
    cidade: 'Valinhos',
    estado: 'SP',
    endereco_completo: 'Carrefour Valinhos - Valinhos, SP',
    lat: -22.9707,
    lng: -46.9958,
    whatsapp: '',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: { segunda_a_sexta: 'Consulte a unidade', sabado: 'Consulte a unidade' },
    foto_capa: '/assets/images/studio-community.jpg',
    galeria: ['/assets/images/studio-community.jpg', '/assets/images/real-machines.jpg', '/assets/images/real-weights.jpg'],
    modalidades: [
      'Step', 'Crosstreino', 'Fit Dance', 'Jump', 'Muay Thai',
      'Zumba', 'Loud Dance', 'GAP', 'Pilates', 'Pump', 'Alongamento',
    ],
    ano_abertura: 2024,
    alunos_ativos: null,
    nota_google: null,
    status: 'ativa',
    destaque: true,
    ordem: 1,
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/1/site/%5BPLUS%5DeIL%5BPLUS%5DfzZNcy7Gt%5BBAR%5DPl5KIrQ%5BEQUAL%5D%5BEQUAL%5D',
  },
  {
    id: 'fallback-ipiranga',
    slug: 'ipiranga',
    nome: 'LoudFit Ipiranga',
    bairro: 'Ipiranga',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco_completo: 'R. Lino Coutinho, 385 - Ipiranga, São Paulo - SP',
    lat: -23.5898,
    lng: -46.6093,
    whatsapp: '',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: { abertura: 'Em inauguração' },
    foto_capa: '/assets/images/real-machines.jpg',
    galeria: ['/assets/images/real-machines.jpg', '/assets/images/real-weights.jpg'],
    modalidades: [],
    ano_abertura: 2025,
    alunos_ativos: null,
    nota_google: null,
    status: 'em_breve',
    destaque: true,
    ordem: 2,
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/6/site/0GaE9Ux52vXSBHXLH2E5hg%5BEQUAL%5D%5BEQUAL%5D',
  },
  {
    id: 'fallback-anchieta',
    slug: 'anchieta-sp',
    nome: 'LoudFit Anchieta SP',
    bairro: 'Vila Moinho Velho',
    cidade: 'São Paulo',
    estado: 'SP',
    endereco_completo: 'Rod. Anchieta, 1778 - Vila Moinho Velho, São Paulo - SP',
    lat: -23.6289,
    lng: -46.5948,
    whatsapp: '',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: { segunda_a_sexta: 'Consulte a unidade', sabado: 'Consulte a unidade' },
    foto_capa: '/assets/images/real-weights.jpg',
    galeria: ['/assets/images/real-weights.jpg', '/assets/images/real-machines.jpg'],
    modalidades: [],
    ano_abertura: 2024,
    alunos_ativos: null,
    nota_google: null,
    status: 'ativa',
    destaque: true,
    ordem: 3,
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/3/site/h%5BBAR%5DKEL8uI95qdrw2eJYudZQ%5BEQUAL%5D%5BEQUAL%5D',
  },
  {
    id: 'fallback-amoreiras',
    slug: 'amoreiras',
    nome: 'LoudFit Amoreiras',
    bairro: 'Amoreiras',
    cidade: 'Campinas',
    estado: 'SP',
    endereco_completo: 'Amoreiras - Campinas, SP',
    lat: -22.9329,
    lng: -47.0738,
    whatsapp: '',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: { segunda_a_sexta: 'Consulte a unidade', sabado: 'Consulte a unidade' },
    foto_capa: '/assets/images/real-facade.jpg',
    galeria: ['/assets/images/real-facade.jpg', '/assets/images/studio-community.jpg'],
    modalidades: [
      'Spinning', 'Pump', 'Pilates', 'FitDance', 'Ritbox',
      'Alongamento', 'GAP', 'Muay Thai', 'Jump',
    ],
    ano_abertura: 2024,
    alunos_ativos: null,
    nota_google: null,
    status: 'ativa',
    destaque: true,
    ordem: 4,
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/2/site/uRcgN1BLXvcYzmC%5BBAR%5DZHe3rg%5BEQUAL%5D%5BEQUAL%5D',
  },
  {
    id: 'fallback-vila-industrial',
    slug: 'vila-industrial',
    nome: 'LoudFit Vila Industrial',
    bairro: 'Vila Industrial',
    cidade: 'Campinas',
    estado: 'SP',
    endereco_completo: 'Vila Industrial - Campinas, SP',
    lat: -22.9099,
    lng: -47.0608,
    whatsapp: '',
    instagram_url: 'https://www.instagram.com/loudfit.vilaindustrial/',
    google_maps_url: '',
    google_place_id: null,
    horarios: { segunda_a_sexta: 'Consulte a unidade', sabado: 'Consulte a unidade' },
    foto_capa: '/assets/images/real-machines.jpg',
    galeria: ['/assets/images/real-machines.jpg', '/assets/images/real-weights.jpg'],
    modalidades: [
      'FitDance', 'Funcional', 'GAP', 'Spinning', 'Pilates', 'Yoga', 'Jiu-Jitsu',
    ],
    ano_abertura: 2024,
    alunos_ativos: null,
    nota_google: null,
    status: 'ativa',
    destaque: true,
    ordem: 5,
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/4/site/7rlDfyRNEkamlvXH5WMvow%5BEQUAL%5D%5BEQUAL%5D',
  },
  {
    id: 'fallback-mogi-mirim',
    slug: 'mogi-mirim',
    nome: 'LoudFit Mogi Mirim',
    bairro: 'Centro',
    cidade: 'Mogi Mirim',
    estado: 'SP',
    endereco_completo: 'Mogi Mirim, SP',
    lat: -22.4321,
    lng: -46.9582,
    whatsapp: '',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: { segunda_a_sexta: 'Consulte a unidade', sabado: 'Consulte a unidade' },
    foto_capa: '/assets/images/real-opening.jpg',
    galeria: ['/assets/images/real-opening.jpg'],
    modalidades: [
      'Pilates Solo', 'FitDance', 'Muay Thai', 'Spinning', 'Ritbox',
      'Jump', 'Funcional', 'Alongamento/Mobilidade',
    ],
    ano_abertura: 2024,
    alunos_ativos: null,
    nota_google: null,
    status: 'ativa',
    destaque: true,
    ordem: 6,
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/5/site/QhXXzoY7OMy%5BPLUS%5DFpULG15Wrw%5BEQUAL%5D%5BEQUAL%5D',
  },
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function getClient() {
  if (!url || url.includes('[') || !anonKey || anonKey.includes('[')) return null
  return createClient(url, anonKey)
}

export async function getUnits(): Promise<Unit[]> {
  const db = getClient()
  if (!db) return fallbackUnits
  const { data, error } = await db.from('units').select('*').order('ordem')
  if (error) return fallbackUnits
  return data?.length ? (data as Unit[]) : fallbackUnits
}

export async function getUnitBySlug(slug: string): Promise<Unit | null> {
  const db = getClient()
  const fallback = fallbackUnits.find((unit) => unit.slug === slug) ?? null
  if (!db) return fallback
  const { data, error } = await db.from('units').select('*').eq('slug', slug).single()
  if (error) return fallback
  return (data as Unit) ?? fallback
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
