import type { MetadataRoute } from 'next'
import { getUnits } from '@/lib/supabase'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loudfit.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const units = await getUnits().catch(() => [])
  const staticRoutes = [
    '',
    '/unidades',
    '/modalidades',
    '/franquias',
    '/sobre',
    '/carreiras',
    '/contato',
    '/politica-de-privacidade',
  ]

  const unitRoutes = units.flatMap((unit) => [
    `/unidades/${unit.slug}`,
    ...(unit.checkoutUrl ? [`/matricula/${unit.slug}`] : []),
  ])

  return [...staticRoutes, ...unitRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/unidades') ? 0.8 : 0.6,
  }))
}
