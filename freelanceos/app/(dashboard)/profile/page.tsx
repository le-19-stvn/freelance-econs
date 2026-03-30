'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useInvoices } from '@/hooks/useInvoices'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import { uploadAvatar } from '@/lib/actions/avatar'
import { createCheckoutSession, createBillingPortalSession } from '@/lib/actions/stripe'
import type { Profile, PlanStatus, PlanType } from '@/types'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  fontSize: 14,
  outline: 'none',
  background: 'var(--bg)',
  color: 'var(--ink)',
  boxSizing: 'border-box',
}

export default function ProfilePage() {
  const supabase = createClient()
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
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const paidTotal = invoices
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
      })
      .eq('id', userId)

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
      setToast({ msg: 'Photo de profil mise à jour !', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err?.message ?? 'Erreur lors de l\'upload.', type: 'error' })
    }
    setUploading(false)
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Profile Card */}
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 100,
            background: toast.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 32,
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Avatar with upload */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={72}
              height={72}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                width: 72,
                height: 72,
              }}
              unoptimized
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              {(form.full_name?.[0] ?? 'F').toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--blue-primary)',
              border: '2px solid var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              padding: 0,
            }}
            title="Modifier la photo"
          >
            {uploading ? (
              <span
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            )}
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
            {form.full_name || 'Freelance'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--blue-primary)',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            {form.company_name || 'Metier'}
          </div>
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: 'var(--muted)',
                fontWeight: 500,
              }}
            >
              TOTAL GAGNE
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--blue-primary)',
                marginTop: 2,
              }}
            >
              {formatCurrency(paidTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 32,
          marginBottom: 28,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 0, marginBottom: 20 }}>
          Abonnement
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Plan badge */}
            <span
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.5,
                background: planType === 'pro' ? 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)' : 'var(--bg)',
                color: planType === 'pro' ? '#fff' : 'var(--muted)',
                border: planType === 'pro' ? 'none' : '1px solid var(--line)',
              }}
            >
              {planType === 'pro' ? 'Pro' : 'Gratuit'}
            </span>

            {/* Status */}
            {planType === 'pro' && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: planStatus === 'active' ? 'var(--success)' : planStatus === 'past_due' ? 'var(--warning)' : 'var(--danger)',
                }}
              >
                {planStatus === 'active' ? 'Actif' : planStatus === 'past_due' ? 'Paiement en retard' : planStatus === 'canceled' ? 'Annulé' : 'Inactif'}
              </span>
            )}
          </div>

          {/* Action button */}
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
              style={{
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: 13,
                cursor: billingLoading ? 'wait' : 'pointer',
                opacity: billingLoading ? 0.6 : 1,
              }}
            >
              {billingLoading ? 'Chargement...' : 'Gérer mon abonnement'}
            </button>
          ) : (
            <button
              onClick={async () => {
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
              }}
              disabled={billingLoading}
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 20px',
                fontWeight: 700,
                fontSize: 13,
                cursor: billingLoading ? 'wait' : 'pointer',
                opacity: billingLoading ? 0.6 : 1,
              }}
            >
              {billingLoading ? 'Chargement...' : 'Passer au plan Pro'}
            </button>
          )}
        </div>

        {planType === 'free' && (
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Le plan Pro inclut : export illimité, factures automatiques, accès prioritaire aux nouvelles fonctionnalités.
          </div>
        )}
      </div>

      {/* Form */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 0, marginBottom: 20 }}>
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
        ].map((field) => (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {field.label}
            </label>
            <input
              type={field.type ?? 'text'}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--blue-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 28px',
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </div>
      </div>
    </div>
  )
}
