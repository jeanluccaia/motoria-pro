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
  return unit.nome.replace(/^LoudFit\s+/i, '').replace(/\s+/g, ' ').trim()
}

export function unitDisplayName(unit: Pick<Unit, 'nome'>) {
  const name = shortUnitName(unit)
  return name ? `LoudFit ${name}` : 'LoudFit'
}

export const displayUnitName = unitDisplayName

function restoreEvoTokenPlaceholders(value: string) {
  return value
    .replace(/(?:%5B|\[)PLUS(?:%5D|\])/gi, '+')
    .replace(/(?:%5B|\[)BAR(?:%5D|\])/gi, '|')
    .replace(/(?:%5B|\[)EQUAL(?:%5D|\])/gi, '=')
}

function decodeUrlSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function normalizeEvoCheckoutUrl(checkoutUrl?: string | null) {
  if (!checkoutUrl) return null

  const restored = restoreEvoTokenPlaceholders(checkoutUrl.trim())

  try {
    const parsed = new URL(restored)
    if (parsed.protocol !== 'https:') return null

    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) => encodeURIComponent(decodeUrlSegment(segment)))
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
