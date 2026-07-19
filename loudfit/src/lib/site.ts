/**
 * URL canônica pública do Loud Fit.
 *
 * `loudfit.com.br` é o domínio oficial e definitivo — usado como
 * `metadataBase`, em canonicals, sitemap.xml, robots.txt e JSON-LD.
 * Aliases da Vercel (loudfit.vercel.app e URLs de deploy) redirecionam
 * para cá em `next.config.ts`.
 *
 * O valor pode ser sobrescrito em runtime via env var pública (útil se um
 * dia for necessário testar em outro domínio); sem env, o fallback é o
 * domínio oficial.
 */

const CANONICAL_SITE_URL = 'https://loudfit.com.br'

function normalizeSiteUrl(value?: string | null) {
  if (!value) return CANONICAL_SITE_URL
  return value.replace(/\/+$/, '')
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_CANONICAL_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
)
