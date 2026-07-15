import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt =
  'Oferta de Inauguração Loud Fit — entre agora e leve alguém com você'
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
          background: '#0A0A0A',
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: '#FFE000', display: 'flex' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '44px' }}>
          <div style={{ width: '44px', height: '4px', background: '#FFE000', display: 'flex' }} />
          <span style={{ color: '#FFE000', fontSize: '16px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Oferta de Inauguração
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Loud Fit"
          width={440}
          height={126}
          style={{ objectFit: 'contain', marginBottom: '36px' }}
        />

        <div style={{ color: '#F2F2F0', fontSize: '54px', fontWeight: 800, lineHeight: 1.05, maxWidth: '900px', display: 'flex', flexDirection: 'column' }}>
          <span>Entre agora e leve</span>
          <span style={{ color: '#FFE000' }}>alguém com você</span>
        </div>

        <div style={{ marginTop: '24px', color: '#909090', fontSize: '22px', fontWeight: 500, lineHeight: 1.4, maxWidth: '820px', display: 'flex' }}>
          Plano Mensal Recorrente + coqueteleira Loud Fit + 30 dias para presentear quem você escolher
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '260px', height: '6px', background: '#FFE000', display: 'flex' }} />

        <div style={{ position: 'absolute', bottom: '48px', right: '96px', color: '#606060', fontSize: '18px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'flex' }}>
          Por tempo limitado
        </div>
      </div>
    ),
    { ...size },
  )
}
