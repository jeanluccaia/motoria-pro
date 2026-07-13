import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Loud Fit — Academia com musculação e aulas inclusas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logoBuffer = await readFile(
    join(process.cwd(), 'public', 'assets', 'images', 'loudfit-logo-official-lockup-yellow.png'),
  )
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#080808',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 96px',
          position: 'relative',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Barra amarela topo */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: '#FFE500', display: 'flex' }} />

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <div style={{ width: '44px', height: '4px', background: '#FFE500', display: 'flex' }} />
          <span style={{ color: '#FFE500', fontSize: '16px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Rede de academias
          </span>
        </div>

        {/* Logo oficial */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Loud Fit"
          width={520}
          height={148}
          style={{ objectFit: 'contain', marginBottom: '40px' }}
        />

        {/* Tagline */}
        <div style={{ color: '#B8B8B8', fontSize: '30px', fontWeight: 500, lineHeight: 1.4, maxWidth: '760px', display: 'flex' }}>
          O melhor ainda está por vir
        </div>

        {/* Acento diagonal inferior esquerdo */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '260px', height: '6px', background: '#FFE500', display: 'flex' }} />

        {/* Domínio */}
        <div style={{ position: 'absolute', bottom: '52px', right: '96px', color: '#606060', fontSize: '18px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, display: 'flex' }}>
          loudfit.com.br
        </div>
      </div>
    ),
    { ...size },
  )
}
