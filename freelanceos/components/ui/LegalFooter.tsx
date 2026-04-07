import Link from 'next/link'

/**
 * Compact footer with legal page links.
 * Required by Stripe for live activation and French law compliance.
 */
export function LegalFooter() {
  return (
    <footer className="px-6 py-4 text-center flex flex-col items-center gap-2">
      <div className="flex gap-6 flex-wrap justify-center">
        <Link
          href="/mentions-legales"
          className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-950 transition-colors duration-100 border-b border-transparent hover:border-zinc-950"
        >
          Mentions legales
        </Link>
        <Link
          href="/cgv"
          className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-950 transition-colors duration-100 border-b border-transparent hover:border-zinc-950"
        >
          CGV / CGU
        </Link>
        <Link
          href="/confidentialite"
          className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-950 transition-colors duration-100 border-b border-transparent hover:border-zinc-950"
        >
          Politique de confidentialite
        </Link>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-300">
        &copy; {new Date().getFullYear()} eCons &mdash; FreelanceOS
      </span>
    </footer>
  )
}
