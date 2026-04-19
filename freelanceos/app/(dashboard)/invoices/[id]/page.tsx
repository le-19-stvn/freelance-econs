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
import type { Invoice, InvoiceItem, InvoiceStatus, UnitType, InvoiceReminder } from '@/types'
import { ArrowLeft, Trash2, FileDown, Save, Plus, X } from 'lucide-react'

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

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

const STATUS_META: Record<InvoiceStatus, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  sent:  { label: 'Envoyee',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid:  { label: 'Payee',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  late:  { label: 'En retard', cls: 'bg-red-50 text-red-700 border-red-200' },
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
  const [planType, setPlanType] = useState<string>('free')
  const [reminders, setReminders] = useState<InvoiceReminder[]>([])

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

      if (!isNew) {
        const { data: rems } = await supabase
          .from('invoice_reminders')
          .select('*')
          .eq('invoice_id', id)
          .order('sequence_step')
        if (rems) setReminders(rems as InvoiceReminder[])
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la facture:', err)
      router.push('/invoices')
    }
    setLoading(false)
  }, [id, isNew, router, supabase])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  useEffect(() => {
    (async () => {
      const userId = await getAuthUserId(supabase).catch(() => null)
      if (!userId) return
      const { data } = await supabase.from('profiles').select('plan_type').eq('id', userId).single()
      setPlanType(data?.plan_type ?? 'free')
    })()
  }, [supabase])

  const ht = calculateHT(items as InvoiceItem[])
  const tva = calculateTVA(ht, tvaRate)
  const ttc = calculateTTC(ht, tvaRate)

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string | number) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))

  const handleSave = async () => {
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

      let invoiceId: string

      if (isNew) {
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

        invoiceId = inv.id

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

        invoiceId = id

        await supabase.from('invoice_items').delete().eq('invoice_id', id)
        if (items.length > 0) {
          const { error: itemsErr } = await supabase
            .from('invoice_items')
            .insert(items.map((it) => ({ ...it, invoice_id: id })))
          if (itemsErr) throw itemsErr
        }
      }

      // Reminders: schedule if Pro + sent + due date; cancel if paid/draft
      if (planType === 'pro') {
        if (status === 'sent' && dueDate) {
          const due = new Date(dueDate)
          const remindersToInsert = [
            { step: 1, offset: 3 },
            { step: 2, offset: 7 },
            { step: 3, offset: 15 },
          ].map((r) => ({
            invoice_id: invoiceId,
            user_id: userId,
            sequence_step: r.step,
            scheduled_at: new Date(due.getTime() + r.offset * 86400000).toISOString(),
            status: 'pending' as const,
          }))

          await supabase
            .from('invoice_reminders')
            .delete()
            .eq('invoice_id', invoiceId)
            .eq('status', 'pending')

          await supabase.from('invoice_reminders').insert(remindersToInsert)
        } else if (status === 'paid' || status === 'draft') {
          await supabase
            .from('invoice_reminders')
            .update({ status: 'failed' })
            .eq('invoice_id', invoiceId)
            .eq('status', 'pending')
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

  /* ─────────── Loading ─────────── */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-10 w-64 bg-zinc-100 rounded mb-3 animate-pulse" />
        <div className="h-4 w-40 bg-zinc-50 rounded mb-8 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse mb-6">
          <div className="h-5 w-32 bg-zinc-100 rounded mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-zinc-50 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-elevated p-8 animate-pulse">
          <div className="h-5 w-44 bg-zinc-100 rounded mb-6" />
          <div className="h-12 w-full bg-zinc-50 rounded-xl" />
        </div>
      </div>
    )
  }

  const meta = STATUS_META[status]

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <button
        onClick={() => router.push('/invoices')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft size={13} />
        Retour aux factures
      </button>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight leading-[1.05]">
            {isNew ? (
              <>Nouvelle facture<span className="text-zinc-400 font-normal">.</span></>
            ) : (
              <>
                <span className="font-mono">{invoiceNumber}</span>
                <span className="text-zinc-400 font-normal"> — facture.</span>
              </>
            )}
          </h1>
          {!isNew && (
            <div className="mt-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[12px] font-medium ${meta.cls}`}>
                {meta.label}
              </span>
            </div>
          )}
        </div>

        {/* Live total preview */}
        <div className="shrink-0 rounded-2xl bg-white shadow-elevated px-5 py-3.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Total TTC</p>
          <p className="text-2xl font-mono font-semibold text-zinc-900 tabular-nums mt-0.5">
            {formatCurrency(ttc, currency)}
          </p>
        </div>
      </div>

      {/* ═══ DETAILS CARD ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 mb-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2.5">
          <span className="font-mono text-xs text-zinc-400">01</span>
          Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Projet</label>
            <select
              value={projectId}
              onChange={(e) => {
                const pid = e.target.value
                setProjectId(pid)
                if (pid && isNew) {
                  const proj = projects.find((p) => p.id === pid)
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
              }}
              className={inputCls}
            >
              <option value="">— Aucun —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className={labelCls}>Date d&apos;emission</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Date d&apos;echeance</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>Taux TVA</label>
            <select
              value={tvaRate}
              onChange={(e) => setTvaRate(parseFloat(e.target.value))}
              className={inputCls}
            >
              {tvaOptions.map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputCls}
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
        </div>

        {!isNew && (
          <div className="mb-4">
            <label className={labelCls}>Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className={inputCls}
            >
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyee</option>
              <option value="paid">Payee</option>
              <option value="late">En retard</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </div>
      </div>

      {/* ═══ ITEMS CARD ═══ */}
      <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 mb-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2.5">
          <span className="font-mono text-xs text-zinc-400">02</span>
          Lignes de facture
        </h2>

        {/* Desktop column header */}
        <div className="hidden md:grid md:grid-cols-[1fr_70px_100px_110px_100px_36px] gap-2 px-1 pb-2 border-b border-zinc-200">
          {['Description', 'Qte', 'Unite', 'Prix unit.', 'Total', ''].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="flex flex-col divide-y divide-zinc-100">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 py-3 md:grid md:grid-cols-[1fr_70px_100px_110px_100px_36px] md:items-center md:gap-2"
            >
              {/* Description */}
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1 block md:hidden">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                />
              </div>

              {/* Qte / Unite / Prix */}
              <div className="grid grid-cols-3 gap-2 md:contents">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1 block md:hidden">
                    Qte
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 font-mono tabular-nums outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1 block md:hidden">
                    Unite
                  </label>
                  <select
                    value={item.unit_type}
                    onChange={(e) => updateItem(idx, 'unit_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                  >
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1 block md:hidden">
                    Prix unit.
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 font-mono tabular-nums outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                  />
                </div>
              </div>

              {/* Total + delete */}
              <div className="flex items-center justify-between md:contents">
                <span className="font-mono font-semibold text-zinc-900 text-sm tabular-nums whitespace-nowrap text-right md:px-1">
                  {formatCurrency(item.quantity * item.unit_price, currency)}
                </span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="w-9 h-9 rounded-lg bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Supprimer la ligne"
                  >
                    <X size={14} />
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
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Ajouter une ligne
        </button>

        {/* Totals */}
        <div className="mt-6 pt-5 border-t border-zinc-200 flex justify-end">
          <div className="min-w-[240px]">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-zinc-500">Total HT</span>
              <span className="font-mono font-medium text-zinc-900 tabular-nums">
                {formatCurrency(ht, currency)}
              </span>
            </div>
            <div className="flex justify-between mb-3 text-sm">
              <span className="text-zinc-500">TVA ({tvaRate}%)</span>
              <span className="font-mono font-medium text-zinc-900 tabular-nums">
                {formatCurrency(tva, currency)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-zinc-200">
              <span className="text-zinc-900 font-semibold">Total TTC</span>
              <span className="font-mono font-semibold text-blue-700 text-lg tabular-nums">
                {formatCurrency(ttc, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ REMINDERS (PRO) ═══ */}
      {planType === 'pro' && reminders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elevated p-6 md:p-8 mb-6">
          <h2 className="text-base font-semibold text-zinc-900 mb-5 flex items-center gap-2.5">
            <span className="font-mono text-xs text-zinc-400">03</span>
            Relances automatiques
          </h2>
          <div className="divide-y divide-zinc-100">
            {reminders.map((r) => {
              const days = r.sequence_step === 1 ? '3' : r.sequence_step === 2 ? '7' : '15'
              const dotCls =
                r.status === 'sent'
                  ? 'bg-emerald-500'
                  : r.status === 'failed'
                  ? 'bg-zinc-300'
                  : 'bg-blue-700'
              const labelText =
                r.status === 'sent' ? 'Envoyee' : r.status === 'failed' ? 'Annulee' : 'En attente'
              const labelCls =
                r.status === 'sent'
                  ? 'text-emerald-700'
                  : r.status === 'failed'
                  ? 'text-zinc-400'
                  : 'text-blue-700'
              return (
                <div key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className={`w-2 h-2 rounded-full ${dotCls}`} />
                  <span className="font-mono text-zinc-700 w-12 tabular-nums">J+{days}</span>
                  <span className="font-mono text-xs text-zinc-400 tabular-nums">
                    {new Date(r.scheduled_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span className={`ml-auto text-xs font-medium ${labelCls}`}>{labelText}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ ACTIONS ═══ */}
      <div className="flex flex-wrap gap-3 justify-end">
        {!isNew && (
          <>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
            <button
              onClick={handleGeneratePDF}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
            >
              <FileDown size={14} />
              Generer PDF
            </button>
          </>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white hover:bg-blue-800 px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${
            saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'
          }`}
        >
          <Save size={14} />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
