import { ImageResponse } from 'next/og'

export const alt = 'LoudFit — Academia com musculação e aulas inclusas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
          padding: '72px 80px',
          position: 'relative',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Barra amarela topo */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: '#FFE500', display: 'flex' }} />

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
          <div style={{ width: '44px', height: '4px', background: '#FFE500', display: 'flex' }} />
          <span style={{ color: '#FFE500', fontSize: '16px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Rede de academias
          </span>
        </div>

        {/* Nome da marca */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '24px' }}>
          <span style={{ color: '#F2F2F0', fontSize: '110px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.01em' }}>
            LOUD
          </span>
          <span style={{ color: '#FFE500', fontSize: '110px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.01em', marginLeft: '20px' }}>
            FIT
          </span>
        </div>

        {/* Tagline */}
        <div style={{ color: '#707070', fontSize: '26px', fontWeight: 400, lineHeight: 1.5, maxWidth: '600px', display: 'flex' }}>
          Musculação + aulas coletivas no mesmo plano.
        </div>

        {/* Acento diagonal inferior esquerdo */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '220px', height: '5px', background: '#FFE500', display: 'flex' }} />

        {/* Domínio */}
        <div style={{ position: 'absolute', bottom: '44px', right: '80px', color: '#404040', fontSize: '18px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, display: 'flex' }}>
          loudfit.com.br
        </div>
      </div>
    ),
    { ...size }
  )
}
