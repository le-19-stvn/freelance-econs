'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import { calculateHT, calculateTVA, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import { generateInvoiceNumber } from '@/lib/utils/invoice-number'
import { checkPlanLimit } from '@/lib/plan-limits'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import type { Invoice, InvoiceItem, InvoiceStatus, UnitType } from '@/types'

const tvaOptions = [0, 5.5, 10, 20]
const unitOptions: { value: UnitType; label: string }[] = [
  { value: 'h', label: 'Heure' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'jour', label: 'Jour' },
]

const emptyItem: Omit<InvoiceItem, 'id' | 'invoice_id'> = {
  description: '',
  quantity: 1,
  unit_type: 'h',
  unit_price: 0,
}

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

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { clients } = useClients()
  const { projects } = useProjects()
  const id = params.id as string
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [tvaRate, setTvaRate] = useState(20)
  const [currency, setCurrency] = useState('EUR')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'invoice_id'>[]>([{ ...emptyItem }])

  const fetchInvoice = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, items:invoice_items(*)')
        .eq('id', id)
        .single()

      if (error || !data) {
        router.push('/invoices')
        return
      }

      const inv = data as Invoice
      setClientId(inv.client_id ?? '')
      setProjectId(inv.project_id ?? '')
      setIssueDate(inv.issue_date ?? '')
      setDueDate(inv.due_date ?? '')
      setTvaRate(inv.tva_rate)
      setCurrency(inv.currency ?? 'EUR')
      setNotes(inv.notes ?? '')
      setStatus(inv.status)
      setInvoiceNumber(inv.invoice_number)
      setItems(
        inv.items && inv.items.length > 0
          ? inv.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unit_type: it.unit_type,
              unit_price: it.unit_price,
            }))
          : [{ ...emptyItem }]
      )
    } catch (err) {
      console.error('Erreur lors du chargement de la facture:', err)
      router.push('/invoices')
    }
    setLoading(false)
  }, [id, isNew, router, supabase])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const ht = calculateHT(items as InvoiceItem[])
  const tva = calculateTVA(ht, tvaRate)
  const ttc = calculateTTC(ht, tvaRate)

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }])
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string | number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )

  const handleSave = async () => {
    // Validation
    if (items.length === 0) {
      alert('La facture doit contenir au moins une ligne.')
      return
    }
    const invalidPrice = items.some((item) => item.unit_price <= 0)
    if (invalidPrice) {
      alert('Chaque ligne doit avoir un prix unitaire superieur a 0.')
      return
    }
    const validTvaRates = [0, 5.5, 10, 20]
    if (!validTvaRates.includes(tvaRate)) {
      alert('Le taux de TVA doit etre 0%, 5.5%, 10% ou 20%.')
      return
    }

    setSaving(true)
    try {
      const userId = await getAuthUserId(supabase)

      const payload = {
        client_id: clientId || null,
        project_id: projectId || null,
        issue_date: issueDate,
        due_date: dueDate || null,
        tva_rate: tvaRate,
        currency: currency,
        notes: notes || null,
        status,
      }

      if (isNew) {
        // ── Plan limit check ──
        const limitCheck = await checkPlanLimit(supabase, userId, 'invoices')
        if (!limitCheck.allowed) {
          setUpgradeMessage(limitCheck.message ?? 'Limite atteinte.')
          setShowUpgrade(true)
          setSaving(false)
          return
        }

        const number = await generateInvoiceNumber(supabase, userId)
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .insert({ ...payload, user_id: userId, invoice_number: number })
          .select()
          .single()
        if (invErr) throw invErr

        if (items.length > 0) {
          const { error: itemsErr } = await supabase
            .from('invoice_items')
            .insert(items.map((it) => ({ ...it, invoice_id: inv.id })))
          if (itemsErr) throw itemsErr
        }
      } else {
        const { error: invErr } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', id)
        if (invErr) throw invErr

        await supabase.from('invoice_items').delete().eq('invoice_id', id)
        if (items.length > 0) {
          const { error: itemsErr } = await supabase
            .from('invoice_items')
            .insert(items.map((it) => ({ ...it, invoice_id: id })))
          if (itemsErr) throw itemsErr
        }
      }
      router.push('/invoices')
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la facture:', err)
      alert('Une erreur est survenue lors de la sauvegarde de la facture.')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette facture ?')) return
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      router.push('/invoices')
    } catch (err) {
      console.error('Erreur lors de la suppression de la facture:', err)
      alert('Une erreur est survenue lors de la suppression de la facture.')
    }
  }

  const handleGeneratePDF = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber || 'facture'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
            {isNew ? 'Nouvelle Facture' : invoiceNumber}
          </h1>
        </div>
        <button
          onClick={() => router.push('/invoices')}
          style={{
            background: 'var(--bg)',
            color: 'var(--muted)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Retour
        </button>
      </div>

      {/* Form Card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
              Client
            </label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
              <option value="">-- Aucun --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
              Projet
            </label>
            <select value={projectId} onChange={(e) => {
              const pid = e.target.value
              setProjectId(pid)
              // Auto-fill from project data
              if (pid && isNew) {
                const proj = projects.find(p => p.id === pid)
                if (proj) {
                  if (proj.client_id) setClientId(proj.client_id)
                  if (proj.budget && proj.budget > 0) {
                    setItems([{
                      description: proj.name,
                      quantity: 1,
                      unit_type: 'forfait',
                      unit_price: proj.budget,
                    }])
                  }
                  setNotes(`Facture - ${proj.name}`)
                }
              }
            }} style={inputStyle}>
              <option value="">-- Aucun --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
              Date d&apos;emission
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
              Date d&apos;echeance
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
              Taux TVA
            </label>
            <select
              value={tvaRate}
              onChange={(e) => setTvaRate(parseFloat(e.target.value))}
              style={inputStyle}
            >
              {tvaOptions.map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
              Devise
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/20"
            >
              <option value="EUR">EUR (&euro;)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (&pound;)</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8 mb-6">
        <h3 className="text-base font-bold text-gray-900 mt-0 mb-4">
          Lignes de facture
        </h3>

        {/* Desktop header — hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-[1fr_70px_100px_110px_90px_40px] gap-2 px-1 pb-2 border-b border-gray-200">
          {['Description', 'Qte', 'Unite', 'Prix unit.', 'Total', ''].map((h) => (
            <span
              key={h}
              className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Item rows — responsive */}
        <div className="flex flex-col gap-4 md:gap-0">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 py-3 border-b border-gray-100 md:grid md:grid-cols-[1fr_70px_100px_110px_90px_40px] md:items-center md:gap-2 md:py-2"
            >
              {/* Description — full width on mobile */}
              <div className="w-full md:col-span-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block md:hidden">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-[var(--bg)] text-[var(--ink)] outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/20"
                />
              </div>

              {/* Qte + Unite + Prix unitaire — 3-col sub-grid on mobile */}
              <div className="grid grid-cols-3 gap-2 md:contents">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block md:hidden">
                    Qte
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-[var(--bg)] text-[var(--ink)] outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block md:hidden">
                    Unite
                  </label>
                  <select
                    value={item.unit_type}
                    onChange={(e) => updateItem(idx, 'unit_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-[var(--bg)] text-[var(--ink)] outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/20"
                  >
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block md:hidden">
                    Prix unit.
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-[var(--bg)] text-[var(--ink)] outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/20"
                  />
                </div>
              </div>

              {/* Total + Delete — flex row on mobile */}
              <div className="flex items-center justify-between md:contents">
                <span className="font-semibold text-[var(--ink)] text-sm whitespace-nowrap">
                  {formatCurrency(item.quantity * item.unit_price, currency)}
                </span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 border-none rounded px-2.5 py-1 cursor-pointer text-[13px] font-semibold transition-colors"
                  >
                    x
                  </button>
                ) : (
                  <span className="hidden md:block" />
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: 12,
            background: 'var(--blue-surface)',
            color: 'var(--blue-primary)',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          + Ajouter une ligne
        </button>

        {/* Totals */}
        <div
          style={{
            marginTop: 24,
            borderTop: '1px solid var(--line)',
            paddingTop: 16,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ minWidth: 220 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Total HT</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {formatCurrency(ht, currency)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              <span style={{ color: 'var(--muted)' }}>TVA ({tvaRate}%)</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {formatCurrency(tva, currency)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 18,
                fontWeight: 800,
                paddingTop: 8,
                borderTop: '2px solid var(--line)',
              }}
            >
              <span style={{ color: 'var(--ink)' }}>Total TTC</span>
              <span style={{ color: 'var(--blue-primary)' }}>
                {formatCurrency(ttc, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        {!isNew && (
          <>
            <button
              onClick={handleDelete}
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: 'none',
                borderRadius: 6,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Supprimer
            </button>
            <button
              onClick={handleGeneratePDF}
              style={{
                background: 'var(--blue-surface)',
                color: 'var(--blue-primary)',
                border: 'none',
                borderRadius: 6,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Generer PDF
            </button>
          </>
        )}
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
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
