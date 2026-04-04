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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
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
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 0, marginBottom: 16 }}>
          Lignes de facture
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Description', 'Qte', 'Unite', 'Prix unitaire', 'Total', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    padding: '8px 6px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '6px' }}>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Description"
                    style={{ ...inputStyle, minWidth: 180 }}
                  />
                </td>
                <td style={{ padding: '6px' }}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, width: 70 }}
                  />
                </td>
                <td style={{ padding: '6px' }}>
                  <select
                    value={item.unit_type}
                    onChange={(e) => updateItem(idx, 'unit_type', e.target.value)}
                    style={{ ...inputStyle, width: 100 }}
                  >
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '6px' }}>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, width: 110 }}
                  />
                </td>
                <td
                  style={{
                    padding: '6px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCurrency(item.quantity * item.unit_price)}
                </td>
                <td style={{ padding: '6px' }}>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      style={{
                        background: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      x
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
                {formatCurrency(ht)}
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
                {formatCurrency(tva)}
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
                {formatCurrency(ttc)}
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
