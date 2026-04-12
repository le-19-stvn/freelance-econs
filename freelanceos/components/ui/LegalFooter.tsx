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
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Mentions legales
        </Link>
        <Link
          href="/cgv"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          CGV / CGU
        </Link>
        <Link
          href="/confidentialite"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Politique de confidentialite
        </Link>
      </div>
      <span className="text-xs font-medium text-zinc-400">
        &copy; {new Date().getFullYear()} eCons Freelance
      </span>
    </footer>
  )
}
