'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useInvoices } from '@/hooks/useInvoices'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import { useRouter } from 'next/navigation'
import { uploadAvatar } from '@/lib/actions/avatar'
import { createCheckoutSession, createBillingPortalSession } from '@/lib/actions/stripe'
import type { Profile, PlanStatus, PlanType } from '@/types'
import { Pencil, LogOut, CreditCard, Sparkles, DollarSign, Check } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const { invoices } = useInvoices()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [planType, setPlanType] = useState<PlanType>('free')
  const [planStatus, setPlanStatus] = useState<PlanStatus>('inactive')
  const [billingLoading, setBillingLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    email: '',
    address: '',
    siret: '',
    tva_number: '',
    tva_rate: '20',
    payment_link: '',
  })

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setLoading(false); return }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      const p = data as Profile
      setAvatarUrl(p.avatar_url ?? null)
      setPlanType(p.plan_type ?? 'free')
      setPlanStatus(p.plan_status ?? 'inactive')
      setForm({
        full_name: p.full_name ?? '',
        company_name: p.company_name ?? '',
        email: p.email ?? '',
        address: p.address ?? '',
        siret: p.siret ?? '',
        tva_number: p.tva_number ?? '',
        tva_rate: String(p.tva_rate ?? 20),
        payment_link: (p as any).payment_link ?? '',
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const safeInvoices = Array.isArray(invoices) ? invoices : []
  const paidTotal = safeInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, inv) => {
      const ht = calculateHT(inv.items ?? [])
      return sum + calculateTTC(ht, inv.tva_rate)
    }, 0)

  const handleSave = async () => {
    setSaving(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(false); return }

    await supabase
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        company_name: form.company_name || null,
        email: form.email,
        address: form.address || null,
        siret: form.siret || null,
        tva_number: form.tva_number || null,
        tva_rate: parseFloat(form.tva_rate) || 20,
        payment_link: form.payment_link || null,
      })
      .eq('id', userId)

    setToast({ msg: 'Profil sauvegarde !', type: 'success' })
    setSaving(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setToast(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadAvatar(formData)
      setAvatarUrl(url)
      setToast({ msg: 'Photo de profil mise a jour !', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err?.message ?? "Erreur lors de l'upload.", type: 'error' })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse mb-7">
          <div className="flex items-center gap-5">
            <div className="w-[72px] h-[72px] rounded-xl bg-zinc-100" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-zinc-100 rounded mb-2" />
              <div className="h-3 w-24 bg-zinc-50 rounded mb-4" />
              <div className="h-7 w-32 bg-zinc-50 rounded" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse mb-7">
          <div className="h-5 w-28 bg-zinc-100 rounded mb-6" />
          <div className="h-10 w-full bg-zinc-50 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse">
          <div className="h-5 w-44 bg-zinc-100 rounded mb-6" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-4">
              <div className="h-3 w-20 bg-zinc-50 rounded mb-2" />
              <div className="h-10 w-full bg-zinc-50 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto animate-fade-in">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-elevated bg-white text-zinc-900 text-[13px] font-medium">
          {toast.type === 'success' ? <Check size={14} className="text-emerald-500" /> : <span className="text-red-500">✕</span>}
          {toast.msg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* ═══ PROFILE CARD ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-8 mb-7">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={72}
                height={72}
                className="rounded-xl object-cover w-[72px] h-[72px]"
                unoptimized
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-[28px]">
                {(form.full_name?.[0] ?? 'F').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-lg bg-blue-700 border-2 border-white flex items-center justify-center ${
                uploading ? 'cursor-wait' : 'cursor-pointer hover:bg-blue-800'
              } transition-colors`}
              title="Modifier la photo"
            >
              {uploading ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
              ) : (
                <Pencil size={13} className="text-white" />
              )}
            </button>
          </div>

          {/* Name + stats */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900">
              {form.full_name || 'Freelance'}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {form.company_name || 'Metier'}
            </p>
            <div className="mt-3">
              <p className="text-xs text-zinc-400">
                Total gagne
              </p>
              <p className="text-2xl font-bold text-zinc-900 mt-0.5">
                {formatCurrency(paidTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SUBSCRIPTION CARD ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-8 mb-7">
        <h2 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2">
          <CreditCard size={18} className="text-zinc-400" />
          Abonnement
        </h2>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Plan badge */}
            {planType === 'pro' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-700 text-white text-[13px] font-medium">
                <Sparkles size={13} />
                Pro
              </span>
            ) : (
              <span className="inline-block px-3.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[13px] font-medium">
                Gratuit
              </span>
            )}

            {/* Status */}
            {planType === 'pro' && (
              <span className="text-sm text-zinc-500">
                {planStatus === 'active' ? 'Actif' : planStatus === 'past_due' ? 'Paiement en retard' : planStatus === 'canceled' ? 'Annule' : 'Inactif'}
              </span>
            )}
          </div>

          {/* Action */}
          {planType === 'pro' ? (
            <button
              onClick={async () => {
                setBillingLoading(true)
                try {
                  const { url } = await createBillingPortalSession()
                  if (url) window.location.href = url
                } catch (err: any) {
                  setToast({ msg: err?.message ?? 'Erreur', type: 'error' })
                }
                setBillingLoading(false)
              }}
              disabled={billingLoading}
              className={`rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                billingLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
              }`}
            >
              {billingLoading ? 'Chargement...' : 'Gerer mon abonnement'}
            </button>
          ) : (
            <button
              onClick={async () => {
                setBillingLoading(true)
                try {
                  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
                  if (!priceId) throw new Error('Price ID non configure')
                  const { url } = await createCheckoutSession(priceId)
                  if (url) window.location.href = url
                } catch (err: any) {
                  setToast({ msg: err?.message ?? 'Erreur', type: 'error' })
                }
                setBillingLoading(false)
              }}
              disabled={billingLoading}
              className={`rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${
                billingLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
              }`}
            >
              {billingLoading ? 'Chargement...' : 'Passer au plan Pro'}
            </button>
          )}
        </div>

        {planType === 'free' && (
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-700" />
                <h3 className="text-sm font-semibold text-zinc-900">Ce que contient le plan Pro</h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-zinc-900 leading-none">5,99 €</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">par mois</div>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                {
                  title: 'Clients, projets & factures illimités',
                  sub: 'Aucune limite sur vos créations, travaillez sans contrainte.',
                },
                {
                  title: 'Simulateur URSSAF',
                  sub: 'Estimez vos cotisations et votre revenu net en temps réel.',
                },
                {
                  title: 'KPI Prévisionnel',
                  sub: 'Visualisez le chiffre d\'affaires à venir (factures envoyées + projets en cours).',
                },
                {
                  title: 'Branding des factures',
                  sub: 'Ajoutez votre logo et votre couleur principale sur tous vos PDF.',
                },
                {
                  title: 'Relances automatiques',
                  sub: 'Relances email J+3, J+7 et J+15 envoyées automatiquement aux clients en retard.',
                },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center mt-0.5">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-900">{f.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{f.sub}</div>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-[11px] text-zinc-400 mt-5 text-center">
              Sans engagement · Résiliable à tout moment
            </p>
          </div>
        )}
      </div>

      {/* ═══ PROFILE FORM ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-8">
        <h2 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2">
          <DollarSign size={18} className="text-zinc-400" />
          Informations du profil
        </h2>

        {[
          { key: 'full_name', label: 'Nom complet' },
          { key: 'company_name', label: 'Nom de la societe' },
          { key: 'email', label: 'Email' },
          { key: 'address', label: 'Adresse' },
          { key: 'siret', label: 'SIRET' },
          { key: 'tva_number', label: 'Numero TVA' },
          { key: 'tva_rate', label: 'Taux TVA par defaut (%)', type: 'number' },
          { key: 'payment_link', label: 'Lien de paiement (Stripe/PayPal)', type: 'url' },
        ].map((field) => (
          <div key={field.key} className="mb-4">
            <label className={labelCls}>
              {field.label}
            </label>
            <input
              type={field.type ?? 'text'}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              className={inputCls}
            />
          </div>
        ))}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`rounded-xl bg-blue-700 text-white px-7 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${
              saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </div>
      </div>

      {/* ═══ LOGOUT ═══ */}
      <div className="mt-7 flex justify-center">
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="rounded-xl bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 px-7 py-2.5 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <LogOut size={15} />
            Deconnexion
          </span>
        </button>
      </div>
    </div>
  )
}
