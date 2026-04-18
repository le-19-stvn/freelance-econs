'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Profile } from '@/types'
import { Save, Check, Upload } from 'lucide-react'
import { ProGate } from '@/components/ui/ProGate'
import { uploadLogo } from '@/lib/actions/logo'
import Image from 'next/image'

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

export default function ParametresPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [entreprise, setEntreprise] = useState({
    company_name: '',
    siret: '',
    address: '',
    tva_assujetti: false,
    tva_number: '',
    tva_rate: '20',
    annual_goal: '',
  })

  const [banque, setBanque] = useState({ iban: '', bic: '' })

  const [planType, setPlanType] = useState<string>('free')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1D4ED8')
  const [logoUploading, setLogoUploading] = useState(false)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setLoading(false); return }

    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      const p = data as Profile
      setEntreprise({
        company_name: p.company_name ?? '',
        siret: p.siret ?? '',
        address: p.address ?? '',
        tva_assujetti: (p.tva_rate ?? 0) > 0,
        tva_number: p.tva_number ?? '',
        tva_rate: String(p.tva_rate ?? 0),
        annual_goal: p.annual_goal != null ? String(p.annual_goal) : '',
      })
      setBanque({ iban: p.iban ?? '', bic: '' })
      setPlanType(p.plan_type ?? 'free')
      setLogoUrl(p.invoice_logo_url ?? null)
      setPrimaryColor(p.invoice_primary_color ?? '#1D4ED8')
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const saveSection = async (section: 'entreprise' | 'banque' | 'branding') => {
    setSaving(section)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(null); return }

    let updates: Record<string, unknown> = {}

    if (section === 'entreprise') {
      // Parse annual goal: empty string → null; positive number → kept; else reject
      let annualGoalValue: number | null = null
      if (entreprise.annual_goal.trim() !== '') {
        const parsed = parseFloat(entreprise.annual_goal)
        if (!isFinite(parsed) || parsed <= 0) {
          setToast({ msg: "L'objectif annuel doit etre un montant positif.", type: 'error' })
          setSaving(null)
          return
        }
        annualGoalValue = parsed
      }

      updates = {
        company_name: entreprise.company_name || null,
        siret: entreprise.siret || null,
        address: entreprise.address || null,
        tva_number: entreprise.tva_assujetti ? (entreprise.tva_number || null) : null,
        tva_rate: entreprise.tva_assujetti ? (parseFloat(entreprise.tva_rate) || 20) : 0,
        annual_goal: annualGoalValue,
      }
    } else if (section === 'banque') {
      updates = { iban: banque.iban || null }
    } else if (section === 'branding') {
      // Mirror the DB trigger — validate #RRGGBB before round-tripping.
      if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
        setToast({ msg: 'Couleur invalide (format attendu : #RRGGBB).', type: 'error' })
        setSaving(null)
        return
      }
      updates = { invoice_primary_color: primaryColor }
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      setToast({ msg: 'Erreur lors de la sauvegarde', type: 'error' })
    } else {
      setToast({ msg: 'Modifications enregistrees', type: 'success' })
    }
    setSaving(null)
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
      setToast({ msg: 'Logo mis a jour', type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'upload'
      setToast({ msg, type: 'error' })
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse">
            <div className="h-4 w-24 bg-zinc-100 rounded mb-6" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-zinc-50 rounded-xl" />
              <div className="h-10 w-full bg-zinc-50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 animate-fade-in">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-elevated text-[13px] font-medium ${
          toast.type === 'success'
            ? 'bg-white text-zinc-900'
            : 'bg-red-50 text-red-700'
        }`}>
          {toast.type === 'success' ? <Check size={14} className="text-emerald-500" /> : <span className="text-red-500">✕</span>}
          {toast.msg}
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-zinc-900 tracking-tight leading-[1.1]">Parametres</h1>
        <p className="text-sm text-zinc-500 mt-1">Informations de votre entite facturante.</p>
      </div>

      {/* ═══ CARD 1 — ENTREPRISE ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-zinc-900">Informations de facturation</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Ces informations apparaissent sur vos factures.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Raison sociale</label>
            <input
              type="text"
              value={entreprise.company_name}
              onChange={(e) => setEntreprise(f => ({ ...f, company_name: e.target.value }))}
              placeholder="Nom de l'entreprise ou Freelance"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>SIRET</label>
            <input
              type="text"
              value={entreprise.siret}
              onChange={(e) => setEntreprise(f => ({ ...f, siret: e.target.value }))}
              placeholder="123 456 789 00012"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Adresse</label>
            <textarea
              value={entreprise.address}
              onChange={(e) => setEntreprise(f => ({ ...f, address: e.target.value }))}
              placeholder="12 rue de la Paix, 75002 Paris"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* TVA Toggle */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-900">Assujetti a la TVA</label>
              </div>
              <button
                type="button"
                onClick={() => setEntreprise(f => ({ ...f, tva_assujetti: !f.tva_assujetti }))}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  entreprise.tva_assujetti ? 'bg-blue-700' : 'bg-zinc-300'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  entreprise.tva_assujetti ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {entreprise.tva_assujetti && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-200">
                <div>
                  <label className={labelCls}>Numero TVA</label>
                  <input
                    type="text"
                    value={entreprise.tva_number}
                    onChange={(e) => setEntreprise(f => ({ ...f, tva_number: e.target.value }))}
                    placeholder="FR12345678901"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Taux (%)</label>
                  <input
                    type="number"
                    value={entreprise.tva_rate}
                    onChange={(e) => setEntreprise(f => ({ ...f, tva_rate: e.target.value }))}
                    placeholder="20"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Annual revenue goal */}
          <div>
            <label className={labelCls}>Objectif annuel (EUR)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={entreprise.annual_goal}
              onChange={(e) => setEntreprise(f => ({ ...f, annual_goal: e.target.value }))}
              placeholder="60000"
              className={inputCls}
            />
            <p className="text-xs text-zinc-400 mt-1.5">
              Affiche en barre de progression sur votre tableau de bord. Laissez vide pour masquer.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => saveSection('entreprise')}
            disabled={saving === 'entreprise'}
            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={14} />
            {saving === 'entreprise' ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* ═══ CARD — BRANDING FACTURES (PRO) ═══ */}
      <ProGate planType={planType}>
        <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-zinc-900">Branding factures</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Personnalisez vos factures avec votre logo et couleurs.</p>
          </div>

          <div className="space-y-6">
            {/* Logo upload */}
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
                  {logoUploading ? 'Upload...' : (logoUrl ? 'Changer' : 'Importer un logo')}
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

            {/* Primary color */}
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
              <p className="text-[10px] text-zinc-400 mt-2">Appliquee au titre, aux totaux et aux lignes d{"'"}accent.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => saveSection('branding')}
              disabled={saving === 'branding'}
              className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={14} />
              {saving === 'branding' ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </ProGate>

      {/* ═══ CARD 2 — BANQUE ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-zinc-900">Coordonnees bancaires</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Affichees en pied de facture pour le paiement par virement.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>IBAN</label>
            <input
              type="text"
              value={banque.iban}
              onChange={(e) => setBanque(f => ({ ...f, iban: e.target.value }))}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>BIC</label>
            <input
              type="text"
              value={banque.bic}
              onChange={(e) => setBanque(f => ({ ...f, bic: e.target.value }))}
              placeholder="BNPAFRPP"
              className={inputCls}
            />
            <p className="text-[10px] text-zinc-400 mt-1">Optionnel</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => saveSection('banque')}
            disabled={saving === 'banque'}
            className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={14} />
            {saving === 'banque' ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
