'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // If Supabase is not configured, skip auth and go to dashboard in demo mode
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== ''
    if (!isConfigured) {
      router.push('/')
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-1">
        Connexion a Freelance
      </h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Gerez votre activite freelance en toute simplicite.
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={async () => {
          setError(null)
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` },
          })
        }}
        className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-[var(--line)] rounded-xl text-[var(--ink)] font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[var(--line)]" />
        <span className="text-[11px] uppercase tracking-[1.5px] text-[var(--muted)] font-medium">
          ou avec votre email
        </span>
        <div className="flex-1 h-px bg-[var(--line)]" />
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[1.5px] text-[var(--muted)] font-medium mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="vous@exemple.com"
            className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:border-[#00A3FF] focus:ring-2 focus:ring-[#00A3FF]/10 focus:outline-none transition-all"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-[1.5px] text-[var(--muted)] font-medium">
              Mot de passe
            </label>
            <button type="button" className="text-[11px] text-[#0057FF] hover:underline font-medium">
              Mot de passe oublie ?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:border-[#00A3FF] focus:ring-2 focus:ring-[#00A3FF]/10 focus:outline-none transition-all"
          />
        </div>

        {error && (
          <div className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#00A3FF] to-[#0057FF] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-[#0057FF]/20"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-[#0057FF] font-semibold hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </>
  )
}
