const fallbackSiteUrl = 'https://loudfit.vercel.app'

function normalizeSiteUrl(value?: string | null) {
  if (!value) return fallbackSiteUrl
  return value.replace(/\/+$/, '')
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_CANONICAL_URL
  ?? (process.env.NEXT_PUBLIC_SITE_URL?.includes('loudfit.vercel.app')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : undefined),
)
