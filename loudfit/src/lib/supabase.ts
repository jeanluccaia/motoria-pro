import { createClient } from '@supabase/supabase-js'
import type { Unit, UnitMedia, Testimonial } from '@/types'
import { normalizeEvoCheckoutUrl } from '@/lib/utils'

/** Monta o UnitMedia mínimo (só fachada oficial) para unidades sem galeria completa ainda. */
function facadeOnlyMedia(folderSlug: string, displayName: string): UnitMedia {
  const facadeSrc = `/media/unidades/${folderSlug}/fotos/fachada-01.webp`
  return {
    cover: facadeSrc,
    gallery: [
      {
        src: facadeSrc,
        alt: `Fachada da unidade Loud Fit ${displayName}`,
        category: 'fachada',
      },
    ],
  }
}

const IPIRANGA_ROOT = '/media/unidades/ipiranga-sp/fotos'
const ipirangaMedia: UnitMedia = {
  cover: `${IPIRANGA_ROOT}/fachada-01.webp`,
  featured: `${IPIRANGA_ROOT}/musculacao-visao-geral-01.webp`,
  gallery: [
    {
      src: `${IPIRANGA_ROOT}/fachada-01.webp`,
      alt: 'Fachada da unidade Loud Fit Ipiranga SP',
      category: 'fachada',
    },
    {
      src: `${IPIRANGA_ROOT}/musculacao-visao-geral-01.webp`,
      alt: 'Visão geral da área de musculação da Loud Fit Ipiranga',
      category: 'musculacao',
    },
    {
      src: `${IPIRANGA_ROOT}/musculacao-01.webp`,
      alt: 'Máquinas de musculação alinhadas na Loud Fit Ipiranga',
      category: 'musculacao',
    },
    {
      src: `${IPIRANGA_ROOT}/peso-livre-01.webp`,
      alt: 'Área de peso livre com halteres na Loud Fit Ipiranga',
      category: 'peso-livre',
    },
    {
      src: `${IPIRANGA_ROOT}/cardio-esteiras-01.webp`,
      alt: 'Sala de cardio com esteiras Loud Fit na unidade Ipiranga',
      category: 'cardio',
    },
    {
      src: `${IPIRANGA_ROOT}/cardio-elipticos-01.webp`,
      alt: 'Sala de cardio com elípticos e bikes de spinning na Loud Fit Ipiranga',
      category: 'cardio',
    },
    {
      src: `${IPIRANGA_ROOT}/estrutura-funcional-01.webp`,
      alt: 'Área integrada de estrutura da Loud Fit Ipiranga',
      category: 'estrutura',
    },
    {
      src: `${IPIRANGA_ROOT}/sala-coletiva-01.webp`,
      alt: 'Sala de aulas coletivas com piso de madeira e mural Loud Fit',
      category: 'aula-coletiva',
    },
  ],
}

const carrefourValinhosMedia = facadeOnlyMedia('carrefour-valinhos', 'Carrefour Valinhos')
const amoreirasMedia = facadeOnlyMedia('amoreiras', 'Amoreiras')
const anchietaMedia = facadeOnlyMedia('anchieta-sp', 'Anchieta SP')
const mogiMirimMedia = facadeOnlyMedia('mogi-mirim', 'Mogi Mirim')
const vilaIndustrialMedia = facadeOnlyMedia('vila-industrial', 'Vila Industrial')

const fallbackUnits: Unit[] = [
  {
    id: 'fallback-carrefour-valinhos',
    slug: 'carrefour-valinhos',
    nome: 'LoudFit Carrefour Valinhos',
    bairro: 'Carrefour Valinhos',
    cidade: 'Valinhos',
    estado: 'SP',
    endereco_completo: 'Av Eng. Antonio Francisco de Paula Souza, 3900, SL 11 - Valinhos, SP',
    lat: -22.9707,
    lng: -46.9958,
    whatsapp: '19994410440',
    whatsapp_url: 'https://wa.me/5519994410440',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: [
      { label: 'Segunda a quinta', value: '06h às 23h' },
      { label: 'Sexta', value: '06h às 22h' },
      { label: 'Sábado, domingo e feriados', value: '08h às 18h' },
    ],
    foto_capa: carrefourValinhosMedia.cover,
    galeria: carrefourValinhosMedia.gallery.map((item) => item.src),
    media: carrefourValinhosMedia,
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
    endereco_completo: 'Rua Lino Coutinho, 385 - Ipiranga, São Paulo - SP',
    lat: -23.5898,
    lng: -46.6093,
    whatsapp: '11937334895',
    whatsapp_url: 'https://wa.me/5511937334895',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 15h' },
      { label: 'Domingo e feriados', value: '08h às 14h' },
    ],
    foto_capa: ipirangaMedia.cover,
    galeria: ipirangaMedia.gallery.map((item) => item.src),
    media: ipirangaMedia,
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
    endereco_completo: 'Rodovia Anchieta, 1778 - Vila Moinho Velho, São Paulo - SP',
    lat: -23.6289,
    lng: -46.5948,
    whatsapp: '11992989496',
    whatsapp_url: 'https://wa.me/5511992989496',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado, domingo e feriados', value: '08h às 18h' },
    ],
    foto_capa: anchietaMedia.cover,
    galeria: anchietaMedia.gallery.map((item) => item.src),
    media: anchietaMedia,
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
    endereco_completo: 'Av. das Amoreiras, 3771 - Campinas, SP',
    lat: -22.9329,
    lng: -47.0738,
    whatsapp: '19998554252',
    whatsapp_url: 'https://wa.me/5519998554252',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 18h' },
      { label: 'Domingo e feriados', value: '08h às 14h' },
    ],
    foto_capa: amoreirasMedia.cover,
    galeria: amoreirasMedia.gallery.map((item) => item.src),
    media: amoreirasMedia,
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
    endereco_completo: 'Rua Antonio Bento, 347 - Vila Industrial, Campinas - SP',
    lat: -22.9099,
    lng: -47.0608,
    whatsapp: '19988291946',
    whatsapp_url: 'https://wa.me/5519988291946',
    instagram_url: 'https://www.instagram.com/loudfit.vilaindustrial/',
    google_maps_url: '',
    google_place_id: null,
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 20h' },
      { label: 'Domingo e feriados', value: '08h às 14h' },
    ],
    foto_capa: vilaIndustrialMedia.cover,
    galeria: vilaIndustrialMedia.gallery.map((item) => item.src),
    media: vilaIndustrialMedia,
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
    endereco_completo: 'Rua Padre Roque, 939 - Mogi Mirim, SP',
    lat: -22.4321,
    lng: -46.9582,
    whatsapp: '19991429998',
    whatsapp_url: 'https://wa.me/5519991429998',
    instagram_url: '',
    google_maps_url: '',
    google_place_id: null,
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 18h' },
      { label: 'Domingo', value: '08h às 16h' },
      { label: 'Feriados', value: '08h às 14h' },
    ],
    foto_capa: mogiMirimMedia.cover,
    galeria: mogiMirimMedia.gallery.map((item) => item.src),
    media: mogiMirimMedia,
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

const officialUnitData: Record<string, Pick<Unit, 'horarios' | 'checkoutUrl'> & { whatsapp_url: string | null }> = {
  'carrefour-valinhos': {
    whatsapp_url: 'https://wa.me/5519994410440',
    horarios: [
      { label: 'Segunda a quinta', value: '06h às 23h' },
      { label: 'Sexta', value: '06h às 22h' },
      { label: 'Sábado, domingo e feriados', value: '08h às 18h' },
    ],
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/1/site/%5BPLUS%5DeIL%5BPLUS%5DfzZNcy7Gt%5BBAR%5DPl5KIrQ%5BEQUAL%5D%5BEQUAL%5D',
  },
  amoreiras: {
    whatsapp_url: 'https://wa.me/5519998554252',
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 18h' },
      { label: 'Domingo e feriados', value: '08h às 14h' },
    ],
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/2/site/uRcgN1BLXvcYzmC%5BBAR%5DZHe3rg%5BEQUAL%5D%5BEQUAL%5D',
  },
  'anchieta-sp': {
    whatsapp_url: 'https://wa.me/5511992989496',
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado, domingo e feriados', value: '08h às 18h' },
    ],
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/3/site/h%5BBAR%5DKEL8uI95qdrw2eJYudZQ%5BEQUAL%5D%5BEQUAL%5D',
  },
  'vila-industrial': {
    whatsapp_url: 'https://wa.me/5519988291946',
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 20h' },
      { label: 'Domingo e feriados', value: '08h às 14h' },
    ],
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/4/site/7rlDfyRNEkamlvXH5WMvow%5BEQUAL%5D%5BEQUAL%5D',
  },
  'mogi-mirim': {
    whatsapp_url: 'https://wa.me/5519991429998',
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 18h' },
      { label: 'Domingo', value: '08h às 16h' },
      { label: 'Feriados', value: '08h às 14h' },
    ],
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/5/site/QhXXzoY7OMy%5BPLUS%5DFpULG15Wrw%5BEQUAL%5D%5BEQUAL%5D',
  },
  ipiranga: {
    whatsapp_url: 'https://wa.me/5511937334895',
    horarios: [
      { label: 'Segunda a quinta', value: '05h às 23h' },
      { label: 'Sexta', value: '05h às 22h' },
      { label: 'Sábado', value: '08h às 15h' },
      { label: 'Domingo e feriados', value: '08h às 14h' },
    ],
    checkoutUrl: 'https://evo-totem.w12app.com.br/loudfit/6/site/0GaE9Ux52vXSBHXLH2E5hg%5BEQUAL%5D%5BEQUAL%5D',
  },
}

const DAY_LABELS: Record<string, string> = {
  segunda_a_sexta: 'Segunda a sexta',
  segunda_a_quinta: 'Segunda a quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
  sabado_e_domingo: 'Sábado e domingo',
  sabado_domingo_e_feriados: 'Sábado, domingo e feriados',
  domingo_e_feriados: 'Domingo e feriados',
  feriados: 'Feriados',
  abertura: 'Abertura',
}

function normalizeHours(horarios: Unit['horarios'] | Record<string, string> | null | undefined): Unit['horarios'] {
  if (Array.isArray(horarios)) return horarios
  return Object.entries(horarios ?? {}).map(([label, value]) => ({
    label: DAY_LABELS[label] ?? label.replaceAll('_', ' '),
    value,
  }))
}

function normalizeUnit(unit: Unit): Unit {
  const official = officialUnitData[unit.slug]
  return {
    ...unit,
    ...official,
    horarios: official?.horarios ?? normalizeHours(unit.horarios),
    checkoutUrl: normalizeEvoCheckoutUrl(official?.checkoutUrl ?? unit.checkoutUrl),
  }
}

function getClient() {
  if (!url || url.includes('[') || !anonKey || anonKey.includes('[')) return null
  return createClient(url, anonKey)
}

export async function getUnits(): Promise<Unit[]> {
  const db = getClient()
  if (!db) return fallbackUnits.map(normalizeUnit)
  const { data, error } = await db.from('units').select('*').order('ordem')
  if (error) return fallbackUnits.map(normalizeUnit)
  return data?.length ? (data as Unit[]).map(normalizeUnit) : fallbackUnits.map(normalizeUnit)
}

export async function getUnitBySlug(slug: string): Promise<Unit | null> {
  const db = getClient()
  const fallback = fallbackUnits.find((unit) => unit.slug === slug) ?? null
  if (!db) return fallback ? normalizeUnit(fallback) : null
  const { data, error } = await db.from('units').select('*').eq('slug', slug).single()
  if (error) return fallback ? normalizeUnit(fallback) : null
  return data ? normalizeUnit(data as Unit) : fallback ? normalizeUnit(fallback) : null
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
