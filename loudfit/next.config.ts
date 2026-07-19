import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/unidades/carreco-curvalinhos',
        destination: '/unidades/carrefour-valinhos',
        permanent: true,
      },
      // Consolidação SEO: força o domínio canônico loudfit.com.br. Preserva
      // o path via :path*. Não afeta URLs de preview da Vercel (hosts
      // dinâmicos como loudfit-<hash>-*.vercel.app não batem com o alias
      // fixo loudfit.vercel.app).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'loudfit.vercel.app' }],
        destination: 'https://loudfit.com.br/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.loudfit.com.br' }],
        destination: 'https://loudfit.com.br/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
