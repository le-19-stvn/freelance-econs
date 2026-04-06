import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Freelance by eCons — Gestion freelance tout-en-un'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 70px',
          background: 'linear-gradient(135deg, #0A1628 0%, #0D2137 50%, #061220 100%)',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00A3FF, #0057FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            eC
          </div>
          <span
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              letterSpacing: '2px',
            }}
          >
            eCons
          </span>
        </div>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            marginBottom: '24px',
          }}
        >
          Freelance
        </div>
        <div
          style={{
            fontSize: '22px',
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.5,
            maxWidth: '600px',
          }}
        >
          Factures, projets, clients, equipe — tout pour gerer votre activite freelance.
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            right: '40px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.25)',
            fontWeight: 500,
          }}
        >
          econs-freelance.com
        </div>
      </div>
    ),
    { ...size }
  )
}
