'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useInvoices } from '@/hooks/useInvoices'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import { uploadAvatar } from '@/lib/actions/avatar'
import { uploadLogo } from '@/lib/actions/logo'
import { createCheckoutSession, createBillingPortalSession } from '@/lib/actions/stripe'
import { ProGate } from '@/components/ui/ProGate'
import type { Profile, PlanStatus, PlanType } from '@/types'
import {
  Pencil,
  LogOut,
  Sparkles,
  Check,
  Upload,
  Save,
} from 'lucide-react'

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

type SectionId =
  | 'identite'
  | 'entreprise'
  | 'facturation'
  | 'branding'
  | 'abonnement'
  | 'securite'

type SaveSection = SectionId | null

const SECTIONS: { id: SectionId; num: string; label: string }[] = [
  { id: 'identite', num: '01', label: 'Identité' },
  { id: 'entreprise', num: '02', label: 'Entreprise' },
  { id: 'facturation', num: '03', label: 'Facturation & RIB' },
  { id: 'branding', num: '04', label: 'Branding factures' },
  { id: 'abonnement', num: '05', label: 'Abonnement' },
  { id: 'securite', num: '06', label: 'Sécurité' },
]

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const { invoices } = useInvoices()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<SaveSection>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('identite')

  // 01 — Identité
  const [identite, setIdentite] = useState({ full_name: '', email: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 02 — Entreprise
  const [entreprise, setEntreprise] = useState({
    company_name: '',
    siret: '',
    address: '',
    tva_assujetti: false,
    tva_number: '',
    tva_rate: '20',
    annual_goal: '',
  })

  // 03 — Facturation & RIB
  const [facturation, setFacturation] = useState({ iban: '', payment_link: '' })

  // 04 — Branding (Pro)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1D4ED8')
  const [logoUploading, setLogoUploading] = useState(false)

  // 05 — Abonnement
  const [planType, setPlanType] = useState<PlanType>('free')
  const [planStatus, setPlanStatus] = useState<PlanStatus>('inactive')
  const [billingLoading, setBillingLoading] = useState(false)

  /* ─────────── Fetch ─────────── */
  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) {
      setLoading(false)
      return
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      const p = data as Profile
      setIdentite({ full_name: p.full_name ?? '', email: p.email ?? '' })
      setAvatarUrl(p.avatar_url ?? null)
      setEntreprise({
        company_name: p.company_name ?? '',
        siret: p.siret ?? '',
        address: p.address ?? '',
        tva_assujetti: (p.tva_rate ?? 0) > 0,
        tva_number: p.tva_number ?? '',
        tva_rate: String(p.tva_rate ?? 20),
        annual_goal: p.annual_goal != null ? String(p.annual_goal) : '',
      })
      setFacturation({
        iban: p.iban ?? '',
        payment_link: (p as any).payment_link ?? '',
      })
      setLogoUrl(p.invoice_logo_url ?? null)
      setPrimaryColor(p.invoice_primary_color ?? '#1D4ED8')
      setPlanType(p.plan_type ?? 'free')
      setPlanStatus(p.plan_status ?? 'inactive')
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  /* ─────────── Stats (header card) ─────────── */
  const safeInvoices = Array.isArray(invoices) ? invoices : []
  const paidTotal = useMemo(
    () =>
      safeInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, inv) => sum + calculateTTC(calculateHT(inv.items ?? []), inv.tva_rate), 0),
    [safeInvoices]
  )

  /* ─────────── Save flows (one per section) ─────────── */
  const saveIdentite = async () => {
    setSaving('identite')
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(null); return }
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: identite.full_name || null,
        email: identite.email,
      })
      .eq('id', userId)
    setToast(
      error
        ? { msg: 'Erreur lors de la sauvegarde', type: 'error' }
        : { msg: 'Identité enregistrée', type: 'success' }
    )
    setSaving(null)
  }

  const saveEntreprise = async () => {
    setSaving('entreprise')
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(null); return }

    let annualGoalValue: number | null = null
    if (entreprise.annual_goal.trim() !== '') {
      const parsed = parseFloat(entreprise.annual_goal)
      if (!isFinite(parsed) || parsed <= 0) {
        setToast({ msg: "L'objectif annuel doit être un montant positif.", type: 'error' })
        setSaving(null)
        return
      }
      annualGoalValue = parsed
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: entreprise.company_name || null,
        siret: entreprise.siret || null,
        address: entreprise.address || null,
        tva_number: entreprise.tva_assujetti ? (entreprise.tva_number || null) : null,
        tva_rate: entreprise.tva_assujetti ? (parseFloat(entreprise.tva_rate) || 20) : 0,
        annual_goal: annualGoalValue,
      })
      .eq('id', userId)
    setToast(
      error
        ? { msg: 'Erreur lors de la sauvegarde', type: 'error' }
        : { msg: 'Entreprise enregistrée', type: 'success' }
    )
    setSaving(null)
  }

  const saveFacturation = async () => {
    setSaving('facturation')
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(null); return }
    const { error } = await supabase
      .from('profiles')
      .update({
        iban: facturation.iban || null,
        payment_link: facturation.payment_link || null,
      })
      .eq('id', userId)
    setToast(
      error
        ? { msg: 'Erreur lors de la sauvegarde', type: 'error' }
        : { msg: 'Facturation enregistrée', type: 'success' }
    )
    setSaving(null)
  }

  const saveBranding = async () => {
    setSaving('branding')
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(null); return }
    if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      setToast({ msg: 'Couleur invalide (format attendu : #RRGGBB).', type: 'error' })
      setSaving(null)
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ invoice_primary_color: primaryColor })
      .eq('id', userId)
    setToast(
      error
        ? { msg: 'Erreur lors de la sauvegarde', type: 'error' }
        : { msg: 'Branding enregistré', type: 'success' }
    )
    setSaving(null)
  }

  /* ─────────── Uploads ─────────── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setToast(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await uploadAvatar(fd)
      setAvatarUrl(url)
      setToast({ msg: 'Photo de profil mise à jour', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err?.message ?? "Erreur lors de l'upload.", type: 'error' })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await uploadLogo(fd)
      setLogoUrl(url)
      setToast({ msg: 'Logo mis à jour', type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'upload"
      setToast({ msg, type: 'error' })
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  /* ─────────── Stripe ─────────── */
  const goPro = async () => {
    setBillingLoading(true)
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
      if (!priceId) throw new Error('Price ID non configuré')
      const { url } = await createCheckoutSession(priceId)
      if (url) window.location.href = url
    } catch (err: any) {
      setToast({ msg: err?.message ?? 'Erreur', type: 'error' })
    }
    setBillingLoading(false)
  }

  const openBillingPortal = async () => {
    setBillingLoading(true)
    try {
      const { url } = await createBillingPortalSession()
      if (url) window.location.href = url
    } catch (err: any) {
      setToast({ msg: err?.message ?? 'Erreur', type: 'error' })
    }
    setBillingLoading(false)
  }

  /* ─────────── Scroll spy for sticky nav ─────────── */
  useEffect(() => {
    if (loading) return
    const handler = () => {
      const offset = 120
      let current: SectionId = 'identite'
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - offset <= 0) current = s.id
      }
      setActiveSection(current)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [loading])

  const scrollTo = (id: SectionId) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  /* ─────────── Loading ─────────── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-12 w-64 bg-zinc-100 rounded mb-2 animate-pulse" />
        <div className="h-4 w-96 bg-zinc-50 rounded mb-10 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
          <div className="hidden lg:block">
            <div className="h-48 bg-zinc-50 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse">
                <div className="h-5 w-40 bg-zinc-100 rounded mb-6" />
                <div className="space-y-3">
                  <div className="h-10 w-full bg-zinc-50 rounded-xl" />
                  <div className="h-10 w-full bg-zinc-50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const planLabel =
    planType === 'pro'
      ? planStatus === 'active'
        ? 'Actif'
        : planStatus === 'past_due'
        ? 'Paiement en retard'
        : planStatus === 'canceled'
        ? 'Annulé'
        : 'Inactif'
      : 'Gratuit'

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-elevated text-[13px] font-medium ${
            toast.type === 'success' ? 'bg-white text-zinc-900' : 'bg-red-50 text-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <span className="text-red-500">✕</span>
          )}
          {toast.msg}
        </div>
      )}

      {/* Hidden avatar input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* ═══ HEADER ═══ */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight leading-[1.05]">
            Mon compte
            <span className="text-zinc-400 font-normal"> — {identite.full_name || 'Freelance'}.</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Identité, entreprise, facturation et abonnement — un seul endroit.
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-white shadow-elevated px-5 py-3.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Total encaissé</p>
          <p className="text-2xl font-mono font-semibold text-zinc-900 tabular-nums mt-0.5">
            {formatCurrency(paidTotal)}
          </p>
        </div>
      </div>

      {/* ═══ LAYOUT : sticky nav + sections ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">

        {/* ─── Sticky nav ─── */}
        <nav className="lg:sticky lg:top-6 lg:self-start">
          {/* Mobile : horizontal scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-500 hover:text-zinc-900 shadow-sm'
                }`}
              >
                <span className="font-mono opacity-60">{s.num}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Desktop : vertical list */}
          <ul className="hidden lg:flex flex-col gap-1">
            {SECTIONS.map((s) => {
              const active = activeSection === s.id
              return (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] ${
                        active ? 'text-white/60' : 'text-zinc-400'
                      }`}
                    >
                      {s.num}
                    </span>
                    <span className="font-medium">{s.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ─── Sections ─── */}
        <div className="flex flex-col gap-7 min-w-0">

          {/* ═══ 01 — IDENTITÉ ═══ */}
          <section id="identite" className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 scroll-mt-24">
            <SectionHeader num="01" title="Identité" subtitle="Votre nom et votre photo affichés sur l'app." />

            <div className="flex items-center gap-5 mb-6">
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
                    {(identite.full_name?.[0] ?? 'F').toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-lg bg-blue-700 border-2 border-white flex items-center justify-center transition-colors ${
                    uploading ? 'cursor-wait' : 'cursor-pointer hover:bg-blue-800'
                  }`}
                  title="Modifier la photo"
                >
                  {uploading ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                  ) : (
                    <Pencil size={13} className="text-white" />
                  )}
                </button>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Photo</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[300px] leading-relaxed">
                  JPG, PNG, WebP ou GIF. La photo apparaît dans la barre supérieure.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nom complet</label>
                <input
                  type="text"
                  value={identite.full_name}
                  onChange={(e) => setIdentite((f) => ({ ...f, full_name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={identite.email}
                  onChange={(e) => setIdentite((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <SaveButton onClick={saveIdentite} loading={saving === 'identite'} />
          </section>

          {/* ═══ 02 — ENTREPRISE ═══ */}
          <section id="entreprise" className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 scroll-mt-24">
            <SectionHeader num="02" title="Entreprise" subtitle="Informations affichées sur vos factures." />

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Raison sociale</label>
                <input
                  type="text"
                  value={entreprise.company_name}
                  onChange={(e) => setEntreprise((f) => ({ ...f, company_name: e.target.value }))}
                  placeholder="Nom de l'entreprise ou Freelance"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>SIRET</label>
                <input
                  type="text"
                  value={entreprise.siret}
                  onChange={(e) => setEntreprise((f) => ({ ...f, siret: e.target.value }))}
                  placeholder="123 456 789 00012"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Adresse</label>
                <textarea
                  value={entreprise.address}
                  onChange={(e) => setEntreprise((f) => ({ ...f, address: e.target.value }))}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* TVA */}
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-900">Assujetti à la TVA</label>
                  <button
                    type="button"
                    onClick={() => setEntreprise((f) => ({ ...f, tva_assujetti: !f.tva_assujetti }))}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      entreprise.tva_assujetti ? 'bg-blue-700' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        entreprise.tva_assujetti ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {entreprise.tva_assujetti && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-200">
                    <div>
                      <label className={labelCls}>Numéro TVA</label>
                      <input
                        type="text"
                        value={entreprise.tva_number}
                        onChange={(e) => setEntreprise((f) => ({ ...f, tva_number: e.target.value }))}
                        placeholder="FR12345678901"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Taux (%)</label>
                      <input
                        type="number"
                        value={entreprise.tva_rate}
                        onChange={(e) => setEntreprise((f) => ({ ...f, tva_rate: e.target.value }))}
                        placeholder="20"
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Objectif annuel (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={entreprise.annual_goal}
                  onChange={(e) => setEntreprise((f) => ({ ...f, annual_goal: e.target.value }))}
                  placeholder="60000"
                  className={inputCls}
                />
                <p className="text-xs text-zinc-400 mt-1.5">
                  Affiché en barre de progression sur votre tableau de bord. Laissez vide pour masquer.
                </p>
              </div>
            </div>

            <SaveButton onClick={saveEntreprise} loading={saving === 'entreprise'} />
          </section>

          {/* ═══ 03 — FACTURATION & RIB ═══ */}
          <section id="facturation" className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 scroll-mt-24">
            <SectionHeader
              num="03"
              title="Facturation & RIB"
              subtitle="Coordonnées de paiement affichées en pied de facture."
            />

            <div className="space-y-4">
              <div>
                <label className={labelCls}>IBAN</label>
                <input
                  type="text"
                  value={facturation.iban}
                  onChange={(e) => setFacturation((f) => ({ ...f, iban: e.target.value }))}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  className={`${inputCls} font-mono`}
                />
              </div>

              <div>
                <label className={labelCls}>Lien de paiement (Stripe / PayPal)</label>
                <input
                  type="url"
                  value={facturation.payment_link}
                  onChange={(e) => setFacturation((f) => ({ ...f, payment_link: e.target.value }))}
                  placeholder="https://..."
                  className={inputCls}
                />
                <p className="text-xs text-zinc-400 mt-1.5">
                  Bouton « Payer » ajouté en bas de chaque facture envoyée.
                </p>
              </div>
            </div>

            <SaveButton onClick={saveFacturation} loading={saving === 'facturation'} />
          </section>

          {/* ═══ 04 — BRANDING (PRO) ═══ */}
          <section id="branding" className="scroll-mt-24">
            <ProGate planType={planType}>
              <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8">
                <SectionHeader
                  num="04"
                  title="Branding factures"
                  subtitle="Personnalisez vos factures avec votre logo et votre couleur."
                  proBadge
                />

                <div className="space-y-6">
                  <div>
                    <label className={labelCls}>Logo</label>
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Logo"
                          width={80}
                          height={40}
                          unoptimized
                          className="rounded-lg bg-zinc-50 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                          <Upload size={14} className="text-zinc-400" />
                        </div>
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-4 py-2 text-sm font-medium transition-colors">
                        <Upload size={14} />
                        {logoUploading ? 'Upload...' : logoUrl ? 'Changer' : 'Importer un logo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleLogoChange}
                          disabled={logoUploading}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">JPG, PNG ou WebP. Max 2 Mo.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Couleur principale</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer"
                      />
                      <input
                        type="text"
                        maxLength={7}
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#1D4ED8"
                        className={`${inputCls} max-w-[160px] font-mono`}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                      Appliquée au titre, aux totaux et aux lignes d&apos;accent.
                    </p>
                  </div>
                </div>

                <SaveButton onClick={saveBranding} loading={saving === 'branding'} />
              </div>
            </ProGate>
          </section>

          {/* ═══ 05 — ABONNEMENT ═══ */}
          <section id="abonnement" className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 scroll-mt-24">
            <SectionHeader num="05" title="Abonnement" subtitle="Plan, facturation Stripe et fonctionnalités Pro." />

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
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
                {planType === 'pro' && (
                  <span className="text-sm text-zinc-500">{planLabel}</span>
                )}
              </div>

              {planType === 'pro' ? (
                <button
                  onClick={openBillingPortal}
                  disabled={billingLoading}
                  className={`rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                    billingLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  {billingLoading ? 'Chargement...' : 'Gérer mon abonnement'}
                </button>
              ) : (
                <button
                  onClick={goPro}
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
                    <div className="text-xl font-mono font-semibold text-zinc-900 leading-none tabular-nums">
                      5,99 €
                    </div>
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
                      sub: "Visualisez le chiffre d'affaires à venir (factures envoyées + projets en cours).",
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
          </section>

          {/* ═══ 06 — SÉCURITÉ ═══ */}
          <section id="securite" className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 scroll-mt-24">
            <SectionHeader num="06" title="Sécurité" subtitle="Session et accès à votre compte." />

            <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl bg-zinc-50 p-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">Déconnexion</p>
                <p className="text-xs text-zinc-500 mt-0.5">Termine la session sur cet appareil.</p>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="rounded-xl bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <LogOut size={14} />
                Se déconnecter
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

/* ─────────── Helpers (component-local) ─────────── */

function SectionHeader({
  num,
  title,
  subtitle,
  proBadge,
}: {
  num: string
  title: string
  subtitle?: string
  proBadge?: boolean
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-zinc-400">{num}</span>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {proBadge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
              <Sparkles size={9} />
              Pro
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Save size={14} />
        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  )
}
