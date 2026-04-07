'use client'

import { useRouter } from 'next/navigation'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  message?: string
}

export function UpgradeModal({ open, onClose, message }: UpgradeModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-[3px] border-zinc-950 p-8 w-[420px] max-w-[90vw] text-center relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-950 border-2 border-zinc-300 hover:border-zinc-950 transition-colors duration-100 cursor-pointer text-lg font-black"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-zinc-950 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tighter leading-none mb-2">
          Passez au plan Pro
        </h2>

        {/* Message */}
        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
          {message || 'Limite atteinte. Passez au plan Pro pour continuer !'}
        </p>

        {/* Features */}
        <div className="bg-[#f4f4f0] border-2 border-zinc-950 p-4 mb-6 text-left">
          {[
            'Clients illimites',
            'Projets actifs illimites',
            'Factures illimitees',
            'Export illimite',
            'Acces prioritaire aux nouvelles fonctionnalites',
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 py-1.5 text-sm text-zinc-900 font-medium"
            >
              <span className="w-5 h-5 bg-zinc-950 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                ✓
              </span>
              {feature}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-zinc-500 border-2 border-zinc-300 hover:border-zinc-950 hover:text-zinc-950 py-3 px-5 font-bold text-sm uppercase tracking-wider transition-colors duration-100 cursor-pointer"
          >
            Plus tard
          </button>
          <button
            onClick={() => {
              onClose()
              router.push('/profile')
            }}
            className="relative flex-1 overflow-hidden bg-zinc-950 text-white border-2 border-zinc-950 py-3 px-5 font-black text-sm uppercase tracking-wider hover:bg-white hover:text-zinc-950 transition-colors duration-100 cursor-pointer group"
          >
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-20deg)]">
              <div className="relative h-full w-10 bg-white/20 blur-md animate-shimmer" />
            </div>
            <span className="relative">Passer au Pro</span>
          </button>
        </div>
      </div>
    </div>
  )
}
