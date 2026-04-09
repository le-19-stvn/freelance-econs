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
import { Pencil, LogOut, CreditCard, Sparkles, DollarSign } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 border border-[#d9d9d9] bg-white text-sm text-[#080808] outline-none focus:border-[#080808] transition-all'

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
      const url = await uploadAvatar(file)
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
        <div className="bg-white border border-[#d9d9d9] p-8 animate-pulse mb-7">
          <div className="flex items-center gap-5">
            <div className="w-[72px] h-[72px] rounded-full bg-zinc-200" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-zinc-200 mb-2" />
              <div className="h-3 w-24 bg-zinc-100 mb-4" />
              <div className="h-7 w-32 bg-zinc-100" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#d9d9d9] p-8 animate-pulse mb-7">
          <div className="h-5 w-28 bg-zinc-200 mb-6" />
          <div className="h-10 w-full bg-zinc-100" />
        </div>
        <div className="bg-white border border-[#d9d9d9] p-8 animate-pulse">
          <div className="h-5 w-44 bg-zinc-200 mb-6" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-4">
              <div className="h-3 w-20 bg-zinc-100 mb-2" />
              <div className="h-10 w-full bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] border ${
          toast.type === 'success'
            ? 'bg-white text-[#080808] border-[#d9d9d9]'
            : 'bg-white text-zinc-600 border-[#d9d9d9]'
        }`}>
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
      <div className="bg-white border border-[#d9d9d9] p-8 mb-7">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={72}
                height={72}
                className="rounded-full object-cover w-[72px] h-[72px]"
                unoptimized
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-zinc-900 flex items-center justify-center text-white font-extrabold text-[28px]">
                {(form.full_name?.[0] ?? 'F').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center ${
                uploading ? 'cursor-wait' : 'cursor-pointer hover:bg-zinc-700'
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
            <h2 className="text-xl font-black text-[#080808]">
              {form.full_name || 'Freelance'}
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mt-0.5">
              {form.company_name || 'Metier'}
            </p>
            <div className="mt-3">
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold">
                Total gagne
              </p>
              <p className="text-2xl font-black text-[#080808] mt-0.5 font-mono">
                {formatCurrency(paidTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SUBSCRIPTION CARD ═══ */}
      <div className="bg-white border border-[#d9d9d9] p-8 mb-7">
        <h2 className="text-[13px] font-black text-[#080808] mb-5 flex items-center gap-2 uppercase tracking-[0.1em]">
          <CreditCard size={18} className="text-zinc-400" />
          Abonnement
        </h2>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Plan badge */}
            {planType === 'pro' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-[#080808] text-[11px] font-black uppercase tracking-[0.08em] text-[#080808] font-mono">
                <Sparkles size={13} />
                Pro
              </span>
            ) : (
              <span className="inline-block px-3.5 py-1 border border-[#d9d9d9] text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500 font-mono">
                Gratuit
              </span>
            )}

            {/* Status */}
            {planType === 'pro' && (
              <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                planStatus === 'active' ? 'text-[#080808]' : planStatus === 'past_due' ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
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
              className={`px-5 py-2 border border-[#d9d9d9] text-[11px] font-bold uppercase tracking-[0.08em] text-[#080808] bg-white hover:border-[#080808] transition-all ${
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
              className={`px-6 py-2.5 text-[11px] font-black text-white bg-[#080808] uppercase tracking-[0.1em] hover:bg-zinc-700 transition-colors ${
                billingLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
              }`}
            >
              {billingLoading ? 'Chargement...' : 'Passer au plan Pro'}
            </button>
          )}
        </div>

        {planType === 'free' && (
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
            Le plan Pro inclut : export illimite, factures automatiques, acces prioritaire aux nouvelles fonctionnalites.
          </p>
        )}
      </div>

      {/* ═══ PROFILE FORM ═══ */}
      <div className="bg-white border border-[#d9d9d9] p-8">
        <h2 className="text-[13px] font-black text-[#080808] mb-5 flex items-center gap-2 uppercase tracking-[0.1em]">
          <DollarSign size={18} className="text-zinc-400" />
          Informations du profil
        </h2>

        {[
          { key: 'full_name', label: 'Nom complet' },
          { key: 'company_name', label: 'Nom de la societe' },
          { key: 'email', label: 'Email' },
          { key: 'address', label: 'Adresse' },
          { key: 'siret', label: 'SIRET', mono: true },
          { key: 'tva_number', label: 'Numero TVA', mono: true },
          { key: 'tva_rate', label: 'Taux TVA par defaut (%)', type: 'number', mono: true },
          { key: 'payment_link', label: 'Lien de paiement (Stripe/PayPal)', type: 'url' },
        ].map((field) => (
          <div key={field.key} className="mb-4">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-1">
              {field.label}
            </label>
            <input
              type={field.type ?? 'text'}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              className={`${inputCls}${(field as any).mono ? ' font-mono' : ''}`}
            />
          </div>
        ))}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-7 py-2.5 text-[11px] font-black text-white bg-[#080808] uppercase tracking-[0.1em] hover:bg-zinc-700 transition-colors ${
              saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
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
          className="px-7 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-500 border border-[#d9d9d9] bg-white hover:bg-zinc-50 hover:text-[#080808] transition-colors cursor-pointer"
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
