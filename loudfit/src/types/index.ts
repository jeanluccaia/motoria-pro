export type UnitStatus = 'ativa' | 'em_breve' | 'em_obras'

export interface Unit {
  id: string
  slug: string
  nome: string
  bairro: string
  cidade: string
  estado: string
  endereco_completo: string
  lat: number
  lng: number
  whatsapp: string
  instagram_url: string
  google_maps_url: string
  google_place_id: string | null
  horarios: Record<string, string>
  foto_capa: string
  galeria: string[]
  modalidades: string[]
  ano_abertura: number
  alunos_ativos: number | null
  nota_google: number | null
  status: UnitStatus
  destaque: boolean
  ordem: number
}

export type TestimonialType = 'aluno' | 'franqueado' | 'gestor'

export interface Testimonial {
  id: string
  tipo: TestimonialType
  nome: string
  unidade_id: string | null
  texto: string
  video_url: string | null
  foto: string
  destaque: boolean
  aprovado: boolean
}

export type LeadStatus = 'novo' | 'contatado' | 'qualificado' | 'descartado'
export type PrazoInvestimento = 'agora' | '3m' | '6m+'

export interface LeadFranquia {
  id: string
  created_at: string
  nome: string
  whatsapp: string
  email: string
  cidade_interesse: string
  capital_disponivel: string
  ja_tem_ponto: boolean
  prazo_investimento: PrazoInvestimento
  origem: string
  status: LeadStatus
}

export interface Vaga {
  id: string
  slug: string
  titulo: string
  unidade_id: string | null
  tipo: 'clt' | 'pj' | 'estagio'
  descricao: string
  ativa: boolean
}
