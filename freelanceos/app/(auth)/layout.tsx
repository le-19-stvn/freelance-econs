'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LegalFooter } from '@/components/ui/LegalFooter'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">

      {/* ═══════════════════════════════════
          LEFT — Brand / Marketing Panel
          ═══════════════════════════════════ */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0D2137] to-[#061220]">

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Blue glow accents */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-700/10 rounded-full blur-[120px]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]" />

        {/* Top — Brand logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/econs-logo-icon.svg"
              alt="eCons"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <span className="text-white/90 font-bold text-lg tracking-tight">eCons</span>
          </Link>
        </div>

        {/* Center — Hero copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 lg:px-16 max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Freelance
          </h1>
          <p className="text-[15px] leading-relaxed text-white/50 mb-10">
            Centralisez votre activite freelance en un seul endroit.
            Factures, projets, clients, equipe — tout ce dont vous avez
            besoin pour vous concentrer sur votre vrai metier.
          </p>

        </div>

        {/* Bottom — Tagline */}
        <div className="relative z-10 p-10">
          <p className="text-xs text-white/20 tracking-wide">
            by eCons — Simplifions le freelancing.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT — Form Panel
          ═══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)]">

        {/* Mobile brand header — visible only on mobile */}
        <div className="flex md:hidden items-center gap-3 p-5 border-b border-[var(--line)] bg-[var(--surface)]">
          <Image
            src="/assets/econs-logo-icon.svg"
            alt="eCons"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div>
            <div className="text-sm font-bold text-[var(--ink)]">Freelance</div>
            <div className="text-[9px] uppercase tracking-[2px] text-[var(--muted)]">by eCons</div>
          </div>
        </div>

        {/* Form — centered */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 md:px-8">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Footer */}
        <LegalFooter />
      </div>
    </div>
  )
}
