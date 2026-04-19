'use client'

/**
 * OnboardingChecklist
 * ────────────────────────────────────────────────────────────
 * Floating setup checklist shown on the dashboard home to guide
 * new users through their first actions. Auto-hides once all four
 * steps are complete. Dismissible via an "X" button — preference
 * persisted in localStorage (per user id) so it doesn't nag.
 *
 * Data is fetched once via lightweight HEAD count queries — no
 * row payload transferred, just the counts.
 * ──────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = {
  key: 'profile' | 'client' | 'project' | 'invoice'
  label: string
  hint: string
  href: string
  done: boolean
}

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Check localStorage dismissal
      const dismissKey = `ecf_onboarding_checklist_dismissed_${user.id}`
      if (typeof window !== 'undefined' && localStorage.getItem(dismissKey) === '1') {
        setDismissed(true)
        return
      }

      // Fire all counts in parallel — HEAD requests, no row payload
      const [profileRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single(),
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['sent', 'paid']),
      ])

      const computed: Step[] = [
        {
          key: 'profile',
          label: 'Complete ton profil',
          hint: 'Infos legales, TVA, IBAN — visible sur tes factures.',
          href: '/profile',
          done: Boolean(profileRes.data?.onboarding_completed),
        },
        {
          key: 'client',
          label: 'Ajoute ton premier client',
          hint: 'Qui vas-tu facturer ?',
          href: '/clients',
          done: (clientsRes.count ?? 0) > 0,
        },
        {
          key: 'project',
          label: 'Cree ton premier projet',
          hint: 'Organise tes missions, prestations, delais.',
          href: '/projects',
          done: (projectsRes.count ?? 0) > 0,
        },
        {
          key: 'invoice',
          label: 'Envoie ta premiere facture',
          hint: 'PDF genere, email envoye, en 2 clics.',
          href: '/invoices',
          done: (invoicesRes.count ?? 0) > 0,
        },
      ]

      setSteps(computed)
    })()
  }, [])

  const handleDismiss = () => {
    if (!userId) return
    const key = `ecf_onboarding_checklist_dismissed_${userId}`
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  // Still loading — render nothing (avoid layout flash)
  if (!steps) return null

  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const pct = Math.round((doneCount / total) * 100)

  // Auto-hide when fully complete OR user dismissed
  if (doneCount === total || dismissed) return null

  return (
    <div className="bg-white rounded-2xl shadow-elevated border border-blue-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">Mise en route</div>
            <div className="text-[11px] text-zinc-500">
              {doneCount}/{total} etape{doneCount > 1 ? 's' : ''} complete{doneCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          title="Masquer"
          aria-label="Masquer la checklist"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-100">
        <div
          className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <ul className="divide-y divide-zinc-100">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              href={step.href}
              className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                step.done
                  ? 'bg-zinc-50/50 hover:bg-zinc-50'
                  : 'hover:bg-blue-50/40'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  step.done
                    ? 'bg-blue-700'
                    : 'bg-white border-2 border-zinc-200'
                }`}
              >
                {step.done && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>

              {/* Label + hint */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    step.done ? 'text-zinc-400 line-through' : 'text-zinc-900'
                  }`}
                >
                  {step.label}
                </div>
                {!step.done && (
                  <div className="text-[11px] text-zinc-500 mt-0.5">{step.hint}</div>
                )}
              </div>

              {/* CTA arrow */}
              {!step.done && (
                <ArrowRight
                  size={15}
                  className="shrink-0 text-zinc-400"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
