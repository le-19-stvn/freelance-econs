'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Profile } from '@/types'
import { Save } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-none bg-[#f5f5f5] border border-[#d9d9d9] text-sm text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors tracking-[-0.02em] font-sans'
const labelCls = 'block text-[11px] font-semibold text-[#0a0a0a]/50 tracking-[-0.02em] mb-1.5 font-mono'
const cardCls = 'bg-white border border-[#d9d9d9] p-6 md:p-8'
const btnCls = 'px-6 py-2.5 rounded-none bg-[#0a0a0a] text-white text-sm font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 font-sans'

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
  })

  const [banque, setBanque] = useState({ iban: '', bic: '' })

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
      })
      setBanque({ iban: p.iban ?? '', bic: '' })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const saveSection = async (section: 'entreprise' | 'banque') => {
    setSaving(section)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(null); return }

    let updates: Record<string, unknown> = {}

    if (section === 'entreprise') {
      updates = {
        company_name: entreprise.company_name || null,
        siret: entreprise.siret || null,
        address: entreprise.address || null,
        tva_number: entreprise.tva_assujetti ? (entreprise.tva_number || null) : null,
        tva_rate: entreprise.tva_assujetti ? (parseFloat(entreprise.tva_rate) || 20) : 0,
      }
    } else if (section === 'banque') {
      updates = { iban: banque.iban || null }
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      setToast({ msg: 'Erreur lors de la sauvegarde', type: 'error' })
    } else {
      setToast({ msg: 'Modifications enregistrees', type: 'success' })
    }
    setSaving(null)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {[1, 2].map((i) => (
          <div key={i} className={`${cardCls} animate-pulse`}>
            <div className="h-4 w-24 bg-[#f0f0f0] mb-6" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-[#f0f0f0]" />
              <div className="h-10 w-full bg-[#f0f0f0]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 font-sans">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 text-[13px] font-medium tracking-[-0.02em] border font-sans ${
          toast.type === 'success'
            ? 'bg-white text-[#0a0a0a] border-[#d9d9d9]'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div>
        <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-mono">(Parametres)</span>
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mt-1 font-sans">Parametres</h1>
        <p className="text-sm text-[#0a0a0a]/50 tracking-[-0.02em] mt-1 font-sans">Informations de votre entite facturante.</p>
      </div>

      {/* ═══ CARD 1 — ENTREPRISE ═══ */}
      <div className={cardCls}>
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-mono">(Facturation)</span>
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-tight font-sans">Informations de facturation</h2>
          <p className="text-[12px] text-[#0a0a0a]/40 tracking-[-0.02em] mt-0.5 font-sans">Ces informations apparaissent sur vos factures.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>(raison_sociale)</label>
            <input
              type="text"
              value={entreprise.company_name}
              onChange={(e) => setEntreprise(f => ({ ...f, company_name: e.target.value }))}
              placeholder="Nom de l'entreprise ou Freelance"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>(siret)</label>
            <input
              type="text"
              value={entreprise.siret}
              onChange={(e) => setEntreprise(f => ({ ...f, siret: e.target.value }))}
              placeholder="123 456 789 00012"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>(adresse)</label>
            <textarea
              value={entreprise.address}
              onChange={(e) => setEntreprise(f => ({ ...f, address: e.target.value }))}
              placeholder="12 rue de la Paix, 75002 Paris"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* TVA Toggle */}
          <div className="border border-[#d9d9d9] p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={labelCls}>(tva)</label>
                <p className="text-sm font-medium text-[#0a0a0a] tracking-[-0.02em] font-sans">Assujetti a la TVA</p>
              </div>
              <button
                type="button"
                onClick={() => setEntreprise(f => ({ ...f, tva_assujetti: !f.tva_assujetti }))}
                className={`relative w-11 h-6 rounded-none transition-colors cursor-pointer ${
                  entreprise.tva_assujetti ? 'bg-[#0a0a0a]' : 'bg-[#d9d9d9]'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                  entreprise.tva_assujetti ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {entreprise.tva_assujetti && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#d9d9d9]">
                <div>
                  <label className={labelCls}>(numero_tva)</label>
                  <input
                    type="text"
                    value={entreprise.tva_number}
                    onChange={(e) => setEntreprise(f => ({ ...f, tva_number: e.target.value }))}
                    placeholder="FR12345678901"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>(taux_%)</label>
                  <input
                    type="number"
                    value={entreprise.tva_rate}
                    onChange={(e) => setEntreprise(f => ({ ...f, tva_rate: e.target.value }))}
                    placeholder="20"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={() => saveSection('entreprise')} disabled={saving === 'entreprise'} className={btnCls}>
            <Save size={14} />
            {saving === 'entreprise' ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* ═══ CARD 2 — BANQUE ═══ */}
      <div className={cardCls}>
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-mono">(Banque)</span>
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-tight font-sans">Coordonnees bancaires</h2>
          <p className="text-[12px] text-[#0a0a0a]/40 tracking-[-0.02em] mt-0.5 font-sans">Affichees en pied de facture pour le paiement par virement.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>(iban)</label>
            <input
              type="text"
              value={banque.iban}
              onChange={(e) => setBanque(f => ({ ...f, iban: e.target.value }))}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className={`${inputCls} font-mono tracking-wider`}
            />
          </div>
          <div>
            <label className={labelCls}>(bic)</label>
            <input
              type="text"
              value={banque.bic}
              onChange={(e) => setBanque(f => ({ ...f, bic: e.target.value }))}
              placeholder="BNPAFRPP"
              className={`${inputCls} font-mono tracking-wider`}
            />
            <p className="text-[10px] text-[#0a0a0a]/30 mt-1 font-mono">Optionnel</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={() => saveSection('banque')} disabled={saving === 'banque'} className={btnCls}>
            <Save size={14} />
            {saving === 'banque' ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
