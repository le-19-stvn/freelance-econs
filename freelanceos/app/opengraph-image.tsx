import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Freelance by eCons — Gestion freelance tout-en-un'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: 'linear-gradient(135deg, #0A1628 0%, #0D2137 50%, #061220 100%)',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        {/* Left content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 70px',
          }}
        >
          {/* Brand tag */}
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
                textTransform: 'uppercase' as const,
              }}
            >
              eCons
            </span>
          </div>

          {/* Title */}
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

          {/* Subtitle */}
          <div
            style={{
              fontSize: '22px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.5,
              maxWidth: '480px',
            }}
          >
            Factures, projets, clients, equipe — tout ce dont vous avez besoin pour gerer votre activite freelance.
          </div>

          {/* CTA pill */}
          <div
            style={{
              display: 'flex',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #00A3FF, #0057FF)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
                padding: '14px 32px',
                borderRadius: '12px',
              }}
            >
              Commencer gratuitement
            </div>
          </div>
        </div>

        {/* Right side — floating UI card mockup */}
        <div
          style={{
            width: '420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 50px 40px 0',
          }}
        >
          <div
            style={{
              width: '340px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Fake KPI rows */}
            {[
              { label: 'Chiffre d\'affaires', value: '12 450 \u20AC' },
              { label: 'Factures envoyees', value: '24' },
              { label: 'Projets actifs', value: '6' },
              { label: 'Clients', value: '11' },
            ].map((kpi, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  paddingBottom: i < 3 ? '16px' : '0',
                }}
              >
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>
                  {kpi.label}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blue glow effects */}
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(0, 163, 255, 0.08)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '100px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(0, 87, 255, 0.06)',
            filter: 'blur(60px)',
          }}
        />

        {/* URL bar */}
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
