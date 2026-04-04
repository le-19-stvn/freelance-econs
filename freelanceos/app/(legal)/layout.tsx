import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
      }}
    >
      {/* Navigation bar */}
      <nav
        style={{
          borderBottom: '1px solid #E4E6ED',
          padding: '16px 0',
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#0F1117',
              textDecoration: 'none',
              letterSpacing: -0.5,
            }}
          >
            FreelanceOS
          </Link>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#6B7280' }}>
            <Link href="/mentions-legales" style={{ color: '#6B7280', textDecoration: 'none' }}>
              Mentions legales
            </Link>
            <Link href="/cgv" style={{ color: '#6B7280', textDecoration: 'none' }}>
              CGV / CGU
            </Link>
            <Link href="/confidentialite" style={{ color: '#6B7280', textDecoration: 'none' }}>
              Confidentialite
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #E4E6ED',
          padding: '24px 0',
          textAlign: 'center',
          fontSize: 12,
          color: '#6B7280',
        }}
      >
        &copy; {new Date().getFullYear()} eCons &mdash; FreelanceOS. Tous droits reserves.
      </footer>
    </div>
  )
}
