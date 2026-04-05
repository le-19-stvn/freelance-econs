'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { User, Receipt } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-[#00A3FF] focus:ring-2 focus:ring-[#00A3FF]/20 transition-all'
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5'

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
    if (siret.trim().length < 9) errs.siret = 'Requis (min. 9 chiffres)'
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
          siret: siret.trim(),
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
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0057FF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
      <div className="w-full max-w-lg">

        {/* ═══ HEADER ═══ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            Bienvenue sur eCons Freelance
          </h1>
          <p className="text-sm text-gray-400">
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
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={15} />
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00A3FF] to-[#0057FF] rounded-full transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
          <div className="text-[11px] text-gray-400 mt-2 text-right">
            Etape {step} sur 2
          </div>
        </div>

        {/* ═══ CARD ═══ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* ── STEP 1: Legal ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Informations legales</h2>
                <p className="text-xs text-gray-400">Ces informations apparaitront sur vos factures.</p>
              </div>

              <div>
                <label className={labelCls}>Nom complet *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Dupont"
                  className={`${inputCls} ${errors.fullName ? '!border-gray-400' : ''}`}
                  autoFocus
                />
                {errors.fullName && <p className="text-xs text-gray-500 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className={labelCls}>Nom de l&apos;entreprise <span className="text-gray-400 font-normal">(optionnel)</span></label>
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
                  className={`${inputCls} ${errors.address ? '!border-gray-400' : ''}`}
                />
                {errors.address && <p className="text-xs text-gray-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className={labelCls}>Numero SIRET *</label>
                <input
                  type="text"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  className={`${inputCls} ${errors.siret ? '!border-gray-400' : ''}`}
                />
                {errors.siret && <p className="text-xs text-gray-500 mt-1">{errors.siret}</p>}
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-[#00A3FF] to-[#0057FF] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Etape suivante
              </button>
            </div>
          )}

          {/* ── STEP 2: Tax & Payment ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Fiscalite & Paiement</h2>
                <p className="text-xs text-gray-400">Configurez votre TVA et vos moyens de paiement.</p>
              </div>

              {/* TVA Toggle */}
              <div>
                <label className={labelCls}>Etes-vous assujetti a la TVA ?</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setTvaSubject(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      tvaSubject
                        ? 'bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white border-transparent'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setTvaSubject(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      !tvaSubject
                        ? 'bg-gray-900 text-white border-transparent'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Non
                  </button>
                </div>
                {!tvaSubject && (
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
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
                <label className={labelCls}>IBAN <span className="text-gray-400 font-normal">(optionnel)</span></label>
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
                <label className={labelCls}>Lien de paiement rapide <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://paypal.me/votrenom"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">Stripe, PayPal.me, Revolut, etc.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Retour
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-[#00A3FF] to-[#0057FF] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Enregistrement...' : 'Terminer'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Vous pourrez modifier ces informations a tout moment dans votre Profil.
        </p>
      </div>
    </div>
  )
}
