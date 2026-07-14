import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Unit } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsApp(numberOrUrl: string, message?: string) {
  const clean = numberOrUrl.replace(/\D/g, '')
  const number = clean.startsWith('55') ? clean : `55${clean}`
  const msg = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${msg}`
}

export function shortUnitName(unit: Pick<Unit, 'nome'>) {
  return unit.nome.replace(/^Loud Fit\s+/i, '').replace(/\s+/g, ' ').trim()
}

export function unitDisplayName(unit: Pick<Unit, 'nome'>) {
  const name = shortUnitName(unit)
  return name ? `Loud Fit ${name}` : 'Loud Fit'
}

export const displayUnitName = unitDisplayName

function decodeUrlSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function normalizeEvoPathSegment(segment: string) {
  const decoded = decodeUrlSegment(segment)
    .replace(/\[PLUS\]/gi, '[PLUS]')
    .replace(/\[BAR\]/gi, '[BAR]')
    .replace(/\[EQUAL\]/gi, '[EQUAL]')

  return encodeURIComponent(decoded)
}

export function normalizeEvoCheckoutUrl(checkoutUrl?: string | null) {
  if (!checkoutUrl) return null

  try {
    const parsed = new URL(checkoutUrl.trim())
    if (parsed.protocol !== 'https:') return null

    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) => normalizeEvoPathSegment(segment))
      .join('/')

    return parsed.toString()
  } catch {
    return null
  }
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
