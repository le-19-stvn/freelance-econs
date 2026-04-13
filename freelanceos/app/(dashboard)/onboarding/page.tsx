'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { User, Receipt } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

const steps = [
  { id: 1, label: 'Informations legales', icon: User },
  { id: 2, label: 'Fiscalite & Paiement', icon: Receipt },
]

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Step 1 fields
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [siret, setSiret] = useState('')

  // Step 2 fields
  const [tvaSubject, setTvaSubject] = useState(false)
  const [tvaRate, setTvaRate] = useState('20')
  const [iban, setIban] = useState('')
  const [paymentLink, setPaymentLink] = useState('')

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill from existing profile
  useEffect(() => {
    ;(async () => {
      try {
        const userId = await getAuthUserId(supabase)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (data) {
          if (data.onboarding_completed) {
            router.replace('/')
            return
          }
          setFullName(data.full_name ?? '')
          setCompanyName(data.company_name ?? '')
          setAddress(data.address ?? '')
          setSiret(data.siret ?? '')
          setTvaRate(String(data.tva_rate ?? 20))
          setTvaSubject((data.tva_rate ?? 0) > 0)
          setIban(data.iban ?? '')
          setPaymentLink(data.payment_link ?? '')
        }
      } catch {}
      setLoading(false)
    })()
  }, [supabase, router])

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (fullName.trim().length < 2) errs.fullName = 'Requis (min. 2 caracteres)'
    if (address.trim().length < 5) errs.address = 'Requis (min. 5 caracteres)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const userId = await getAuthUserId(supabase)
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          company_name: companyName.trim() || null,
          address: address.trim(),
          siret: siret.trim() || null,
          tva_rate: tvaSubject ? parseFloat(tvaRate) || 20 : 0,
          tva_number: tvaSubject ? undefined : null,
          iban: iban.trim() || null,
          payment_link: paymentLink.trim() || null,
          onboarding_completed: true,
        })
        .eq('id', userId)

      router.replace('/')
    } catch (err) {
      console.error('Onboarding save failed:', err)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-lg">

        {/* ═══ HEADER ═══ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">
            Bienvenue sur eCons Freelance
          </h1>
          <p className="text-sm text-zinc-400">
            Completez votre profil pour commencer a facturer.
          </p>
        </div>

        {/* ═══ PROGRESS BAR ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s) => {
              const Icon = s.icon
              const isActive = step >= s.id
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    <Icon size={15} />
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Bar */}
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-700 rounded-full transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 text-right">
            Etape {step} sur 2
          </div>
        </div>

        {/* ═══ CARD ═══ */}
        <div className="bg-white rounded-2xl shadow-elevated p-8">

          {/* ── STEP 1: Legal ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Informations legales</h2>
                <p className="text-xs text-zinc-400">Ces informations apparaitront sur vos factures.</p>
              </div>

              <div>
                <label className={labelCls}>Nom complet *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Dupont"
                  className={`${inputCls} ${errors.fullName ? '!border-red-500 !ring-red-500/20' : ''}`}
                  autoFocus
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className={labelCls}>Nom de l&apos;entreprise <span className="text-zinc-400 font-normal">(optionnel)</span></label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Mon Entreprise SASU"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Adresse postale *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  className={`${inputCls} ${errors.address ? '!border-red-500 !ring-red-500/20' : ''}`}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className={labelCls}>Numero SIRET <span className="text-zinc-400 font-normal">(optionnel)</span></label>
                <input
                  type="text"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  className={inputCls}
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-2 py-3 rounded-xl text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Etape suivante
              </button>
            </div>
          )}

          {/* ── STEP 2: Tax & Payment ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Fiscalite & Paiement</h2>
                <p className="text-xs text-zinc-400">Configurez votre TVA et vos moyens de paiement.</p>
              </div>

              {/* TVA Toggle */}
              <div>
                <label className={labelCls}>Etes-vous assujetti a la TVA ?</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setTvaSubject(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] cursor-pointer ${
                      tvaSubject
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setTvaSubject(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] cursor-pointer ${
                      !tvaSubject
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Non
                  </button>
                </div>
                {!tvaSubject && (
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    TVA non applicable, art. 293 B du CGI — cette mention sera ajoutee automatiquement sur vos factures.
                  </p>
                )}
              </div>

              {/* TVA Rate — only if subject */}
              {tvaSubject && (
                <div>
                  <label className={labelCls}>Taux de TVA par defaut (%)</label>
                  <input
                    type="number"
                    value={tvaRate}
                    onChange={(e) => setTvaRate(e.target.value)}
                    placeholder="20"
                    min="0"
                    max="100"
                    step="0.1"
                    className={inputCls}
                  />
                </div>
              )}

              {/* IBAN */}
              <div>
                <label className={labelCls}>IBAN <span className="text-zinc-400 font-normal">(optionnel)</span></label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  className={inputCls}
                />
              </div>

              {/* Payment Link */}
              <div>
                <label className={labelCls}>Lien de paiement rapide <span className="text-zinc-400 font-normal">(optionnel)</span></label>
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://paypal.me/votrenom"
                  className={inputCls}
                />
                <p className="text-[11px] text-zinc-400 mt-1">Stripe, PayPal.me, Revolut, etc.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-zinc-100 text-zinc-900 px-5 py-3 text-sm font-medium hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Retour
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  {saving ? 'Enregistrement...' : 'Terminer'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-400 mt-6">
          Vous pourrez modifier ces informations a tout moment dans votre Profil.
        </p>
      </div>
    </div>
  )
}
