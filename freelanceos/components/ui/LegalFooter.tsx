import Link from 'next/link'

/**
 * Compact footer with legal page links.
 * Required by Stripe for live activation and French law compliance.
 */
export function LegalFooter() {
  return (
    <footer
      style={{
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/mentions-legales"
          style={{ color: 'var(--muted)', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          Mentions legales
        </Link>
        <Link
          href="/cgv"
          style={{ color: 'var(--muted)', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          CGV / CGU
        </Link>
        <Link
          href="/confidentialite"
          style={{ color: 'var(--muted)', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          Politique de confidentialite
        </Link>
      </div>
      <span>&copy; {new Date().getFullYear()} eCons &mdash; FreelanceOS</span>
    </footer>
  )
}
