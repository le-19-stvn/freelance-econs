import Link from 'next/link'

/**
 * Compact footer with legal page links.
 * Required by Stripe for live activation and French law compliance.
 */
export function LegalFooter() {
  return (
    <footer className="py-4 px-6 text-center flex flex-col items-center gap-1.5">
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/mentions-legales"
          className="text-[12px] font-medium text-[#0a0a0a]/40 tracking-[-0.04em] hover:text-[#0a0a0a] transition-colors"
        >
          Mentions legales
        </Link>
        <Link
          href="/cgv"
          className="text-[12px] font-medium text-[#0a0a0a]/40 tracking-[-0.04em] hover:text-[#0a0a0a] transition-colors"
        >
          CGV / CGU
        </Link>
        <Link
          href="/confidentialite"
          className="text-[12px] font-medium text-[#0a0a0a]/40 tracking-[-0.04em] hover:text-[#0a0a0a] transition-colors"
        >
          Politique de confidentialite
        </Link>
      </div>
      <span className="text-[10px] font-medium text-[#0a0a0a]/40 tracking-[-0.04em]">
        &copy; {new Date().getFullYear()} eCons &mdash; FreelanceOS
      </span>
    </footer>
  )
}
