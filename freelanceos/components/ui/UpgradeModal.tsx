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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: '40px 36px 32px',
          width: 420,
          maxWidth: '90vw',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 20,
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
        >
          ✕
        </button>

        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--ink)',
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          Passez au plan Pro
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          {message || 'Limite atteinte. Passez au plan Pro pour continuer !'}
        </p>

        {/* Features */}
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          {[
            'Clients illimités',
            'Projets actifs illimités',
            'Factures illimitées',
            'Export illimité',
            'Accès prioritaire aux nouvelles fonctionnalités',
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {feature}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'var(--bg)',
              color: 'var(--muted)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Plus tard
          </button>
          <button
            onClick={() => {
              onClose()
              router.push('/profile')
            }}
            className="relative group overflow-hidden rounded-lg bg-black px-8 py-3 font-medium text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ flex: 1, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-20deg)]">
              <div className="relative h-full w-10 bg-white/30 blur-md animate-shimmer" />
            </div>
            <span className="relative font-bold">Passer au Pro</span>
          </button>
        </div>
      </div>
    </div>
  )
}
