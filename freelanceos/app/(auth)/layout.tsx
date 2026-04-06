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
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#00A3FF]/10 rounded-full blur-[120px]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#0057FF]/8 rounded-full blur-[100px]" />

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

          {/* Floating testimonial card */}
          <div className="bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-6">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-[#00A3FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-white/60 leading-relaxed italic mb-4">
              &ldquo;J&apos;ai remplace 3 outils differents par Freelance. Mes factures sont pro, mon suivi est clair, et je gagne 2h par semaine.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#0057FF] flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <div>
                <div className="text-white/80 text-sm font-medium">Marie L.</div>
                <div className="text-white/30 text-xs">Designer freelance</div>
              </div>
            </div>
          </div>
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
