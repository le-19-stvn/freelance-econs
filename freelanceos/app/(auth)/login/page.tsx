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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-xl border border-[var(--line)] p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)' }}>
            <span className="text-[15px] font-extrabold text-white" style={{ letterSpacing: -0.5 }}>FR</span>
          </div>
          <div>
            <div className="text-[13px] font-bold text-[var(--ink)]">eCons Freelance</div>
            <div className="text-[9px] uppercase tracking-[2px] text-[var(--muted)]">by eCons</div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-6">Connexion</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[9px] uppercase tracking-[1.5px] text-[var(--muted)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-md text-[var(--ink)] focus:border-[var(--blue-primary)] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-[1.5px] text-[var(--muted)] mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-md text-[var(--ink)] focus:border-[var(--blue-primary)] focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--blue-primary)] text-white font-bold rounded-md hover:bg-[var(--blue-mid)] transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-[var(--blue-primary)] font-semibold hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
