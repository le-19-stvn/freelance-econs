'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import type { Invoice, InvoiceStatus } from '@/types'
import { FileText, Download, ChevronDown, Check, Send, Eye } from 'lucide-react'

/* ── Toast ── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-elevated bg-white text-zinc-900 text-[13px] font-medium">
      {type === 'success' ? <Check size={14} className="text-emerald-500" /> : <span className="text-red-500 text-sm">✕</span>} {message}
    </div>
  )
}

/* ── Email Send Button ── */
function EmailButton({
  invoice,
  onSuccess,
  onError,
}: {
  invoice: Invoice
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [sending, setSending] = useState(false)

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!invoice.client?.email) {
      onError("Le client n'a pas d'adresse email configuree")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/email`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        onError(data.error || "Erreur lors de l'envoi")
        return
      }

      onSuccess(`Email envoye a ${invoice.client.name} !`)
    } catch {
      onError("Erreur reseau lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  const hasEmail = !!invoice.client?.email

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      title={hasEmail ? `Envoyer a ${invoice.client?.email}` : "Pas d'email client"}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium transition-all active:scale-[0.98] ${
        hasEmail
          ? 'text-zinc-900 hover:bg-blue-700 hover:text-white hover:border-blue-700 cursor-pointer'
          : 'text-zinc-400 cursor-not-allowed'
      } ${sending ? 'opacity-60 cursor-wait' : ''}`}
    >
      <Send size={13} />
      {sending ? 'Envoi...' : 'Email'}
    </button>
  )
}

/* ── Status transition map ── */
type Transition = { to: InvoiceStatus; label: string }

function getTransitions(current: InvoiceStatus): Transition[] {
  switch (current) {
    case 'draft':
      return [
        { to: 'sent', label: 'Marquer comme Envoyee' },
        { to: 'paid', label: 'Marquer comme Payee' },
      ]
    case 'sent':
      return [
        { to: 'paid', label: 'Marquer comme Payee' },
        { to: 'late', label: 'Marquer en Retard' },
        { to: 'draft', label: 'Remettre en Brouillon' },
      ]
    case 'paid':
      return [
        { to: 'draft', label: 'Remettre en Brouillon' },
      ]
    case 'late':
      return [
        { to: 'paid', label: 'Marquer comme Payee' },
        { to: 'sent', label: 'Remettre en Envoyee' },
      ]
    default:
      return []
  }
}

/* ── PDF Download Button ── */
function PdfButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLoading(true)
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Telecharger le PDF"
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all active:scale-[0.98] ${
        loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'
      }`}
    >
      <Download size={13} />
      PDF
    </button>
  )
}

/* ── Status Dropdown ── */
function StatusDropdown({
  invoiceId,
  currentStatus,
  onUpdate,
}: {
  invoiceId: string
  currentStatus: InvoiceStatus
  onUpdate: (id: string, status: InvoiceStatus) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const transitions = getTransitions(currentStatus)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = async (to: InvoiceStatus) => {
    setUpdating(true)
    setOpen(false)
    try {
      await onUpdate(invoiceId, to)
    } catch (err) {
      console.error('Status update failed:', err)
    }
    setUpdating(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (transitions.length > 0) setOpen(!open)
        }}
        disabled={updating}
        className={`${transitions.length > 0 ? 'cursor-pointer' : 'cursor-default'} ${updating ? 'opacity-50' : ''} transition-all`}
      >
        <StatusBadge
          variant={currentStatus}
          className={transitions.length > 0 ? 'pr-2' : ''}
        />
        {transitions.length > 0 && (
          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 rounded-2xl shadow-elevated-lg border border-zinc-100 bg-white z-50 min-w-[230px] overflow-hidden">
          <div className="px-3.5 py-2 text-[11px] font-medium text-zinc-400 border-b border-zinc-100">
            Changer le statut
          </div>
          {transitions.map((t) => (
            <button
              key={t.to}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(t.to)
              }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-zinc-900 text-left hover:bg-zinc-50 transition-colors"
            >
              <StatusBadge variant={t.to} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
type TabKey = 'all' | 'draft' | 'sent' | 'paid' | 'late'

const TAB_ORDER: { key: TabKey; label: string }[] = [
  { key: 'all',   label: 'Toutes' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'sent',  label: 'Envoyées' },
  { key: 'paid',  label: 'Payées' },
  { key: 'late',  label: 'En retard' },
]

export default function InvoicesPage() {
  const { invoices, loading, updateStatus, fetchInvoices } = useInvoices()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const counts = useMemo(() => ({
    all:   invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent:  invoices.filter(i => i.status === 'sent').length,
    paid:  invoices.filter(i => i.status === 'paid').length,
    late:  invoices.filter(i => i.status === 'late').length,
  }), [invoices])

  const filteredInvoices = useMemo(
    () => activeTab === 'all' ? invoices : invoices.filter(i => i.status === activeTab),
    [invoices, activeTab]
  )

  const handleEmailSuccess = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchInvoices()
  }

  const handleEmailError = (msg: string) => {
    setToast({ message: msg, type: 'error' })
  }

  const handleExportCSV = () => {
    const esc = (v: string) =>
      /[;\n\r"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

    const statusLabels: Record<InvoiceStatus, string> = {
      draft: 'Brouillon',
      sent: 'Envoyee',
      paid: 'Payee',
      late: 'En retard',
    }

    // Export respects the active tab: "Payees" -> only paid, "Toutes" -> all, etc.
    const header = 'Numero;Client;Date;Montant;Statut'
    const rows = filteredInvoices.map((inv) => {
      const ht = calculateHT(inv.items ?? [])
      const ttc = calculateTTC(ht, inv.tva_rate)
      const clientName = inv.client?.name ?? ''
      const date = inv.issue_date
        ? new Date(inv.issue_date).toLocaleDateString('fr-FR')
        : ''
      const status = statusLabels[inv.status] ?? inv.status
      return [inv.invoice_number, clientName, date, ttc.toFixed(2), status]
        .map(esc)
        .join(';')
    })
    const csv = '\uFEFF' + [header, ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Filename reflects the active tab: factures_payees.csv, factures_brouillons.csv, etc.
    const tabSlug: Record<TabKey, string> = {
      all: 'toutes',
      draft: 'brouillons',
      sent: 'envoyees',
      paid: 'payees',
      late: 'en_retard',
    }
    a.download = `factures_${tabSlug[activeTab]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-elevated p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-zinc-100 rounded mb-2" />
                  <div className="h-3 w-44 bg-zinc-50 rounded" />
                </div>
                <div className="h-8 w-20 bg-zinc-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.05]">
            Factures <span className="text-zinc-300 font-normal">—</span>{' '}
            <span className="italic font-bold text-zinc-500">suivi &amp; relances.</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Gérez vos factures, devis et relances client.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredInvoices.length === 0}
            title={`Exporte l'onglet actif (${filteredInvoices.length})`}
            className={`inline-flex items-center gap-2 bg-zinc-100 text-zinc-900 rounded-xl px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
              filteredInvoices.length === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-zinc-200 cursor-pointer'
            }`}
          >
            <Download size={15} />
            Exporter
            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              ({filteredInvoices.length})
            </span>
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            + Nouvelle Facture
          </Link>
        </div>
      </div>

      {/* ═══ STATUS TABS ═══ */}
      {invoices.length > 0 && (
        <div className="mb-5 border-b border-zinc-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 min-w-max">
            {TAB_ORDER.map(tab => {
              const active = activeTab === tab.key
              const count = counts[tab.key]
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                  <span className={`font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded ${
                    active
                      ? tab.key === 'late' ? 'bg-red-50 text-red-700' : 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-zinc-900" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ INVOICE LIST ═══ */}
      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-sm text-zinc-400">
            Aucune facture enregistree.
          </p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-elevated">
          <FileText size={36} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm text-zinc-400">
            Aucune facture dans cette categorie.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredInvoices.map((inv, idx) => {
            const ht = calculateHT(inv.items ?? [])
            const ttc = calculateTTC(ht, inv.tva_rate)
            return (
              <div
                key={inv.id}
                className={`bg-white rounded-2xl shadow-elevated p-4 hover:shadow-elevated-lg transition-all group animate-fade-in animate-stagger-${Math.min(idx + 1, 8)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  {/* Left — icon + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shrink-0">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-semibold text-zinc-900 text-sm group-hover:text-zinc-600 transition-colors">
                          {inv.invoice_number}
                        </span>
                        <StatusDropdown
                          invoiceId={inv.id}
                          currentStatus={inv.status}
                          onUpdate={updateStatus}
                        />
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5 truncate">
                        {inv.client?.name ?? '---'}
                        {inv.project?.name && (
                          <span> &middot; {inv.project.name}</span>
                        )}
                        {inv.issue_date && (
                          <span className="ml-2 text-xs">
                            &middot; {new Date(inv.issue_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right — amount + actions */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right mr-2">
                      <div className="font-mono font-semibold text-zinc-900 text-base">
                        {formatCurrency(ttc, inv.currency ?? 'EUR')}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">
                        TTC
                      </div>
                    </div>

                    <EmailButton
                      invoice={inv}
                      onSuccess={handleEmailSuccess}
                      onError={handleEmailError}
                    />

                    <PdfButton invoiceId={inv.id} />

                    <Link
                      href={`/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all active:scale-[0.98]"
                    >
                      <Eye size={13} />
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
