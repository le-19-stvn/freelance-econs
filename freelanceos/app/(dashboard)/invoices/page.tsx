'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import type { Invoice, InvoiceStatus } from '@/types'
import { FileText, Download, ChevronDown, Check, Send, Eye } from 'lucide-react'

/* ── Status badge config ── */
const statusBadge: Record<InvoiceStatus, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Brouillon' },
  sent: { bg: 'bg-blue-50', text: 'text-[#0057FF]', dot: 'bg-[#0057FF]', label: 'Envoyee' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Payee' },
  late: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'En retard' },
}

/* ── Toast ── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-xl text-[13px] font-semibold shadow-lg border ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {type === 'success' ? <Check size={14} /> : <span className="text-sm">✕</span>} {message}
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
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
        hasEmail
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white cursor-pointer'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-[#0057FF] hover:bg-[#0057FF] hover:text-white transition-all ${
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
  const badge = statusBadge[currentStatus]
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
        disabled={updating || transitions.length === 0}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase ${badge.bg} ${badge.text} ${
          transitions.length > 0 ? 'cursor-pointer' : 'cursor-default'
        } ${updating ? 'opacity-50' : ''} transition-all`}
      >
        {updating ? '...' : badge.label}
        {transitions.length > 0 && <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[230px] overflow-hidden">
          <div className="px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[1.5px] text-gray-400 border-b border-gray-100">
            Changer le statut
          </div>
          {transitions.map((t) => {
            const targetBadge = statusBadge[t.to]
            return (
              <button
                key={t.to}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(t.to)
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-800 text-left hover:bg-gray-50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${targetBadge.dot} shrink-0`} />
                <span className="flex-1">{t.label}</span>
                <Check size={13} className="text-gray-300" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function InvoicesPage() {
  const { invoices, loading, updateStatus, fetchInvoices } = useInvoices()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

    const header = 'Numero;Client;Date;Montant;Statut'
    const rows = invoices.map((inv) => {
      const ht = calculateHT(inv.items ?? [])
      const ttc = calculateTTC(ht, inv.tva_rate)
      const clientName = inv.client?.name ?? ''
      const date = inv.issue_date
        ? new Date(inv.issue_date).toLocaleDateString('fr-FR')
        : ''
      const status = statusBadge[inv.status]?.label ?? inv.status
      return [inv.invoice_number, clientName, date, ttc.toFixed(2), status]
        .map(esc)
        .join(';')
    })
    const csv = '\uFEFF' + [header, ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'factures_export.csv'
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
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-44 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-20 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Factures
          </h1>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">
            {invoices.length} facture(s) enregistree(s)
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={invoices.length === 0}
            className={`inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              invoices.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-[#00A3FF] hover:text-[#0057FF] cursor-pointer'
            }`}
          >
            <Download size={15} />
            Exporter
          </button>
          <Link
            href="/invoices/new"
            className="bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Nouvelle Facture
          </Link>
        </div>
      </div>

      {/* ═══ INVOICE LIST ═══ */}
      {invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-400" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Aucune facture enregistree.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((inv) => {
            const ht = calculateHT(inv.items ?? [])
            const ttc = calculateTTC(ht, inv.tva_rate)
            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-[#00A3FF]/40 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  {/* Left — icon + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A3FF] to-[#0057FF] flex items-center justify-center text-white shrink-0">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-gray-900 font-mono text-sm group-hover:text-[#0057FF] transition-colors">
                          {inv.invoice_number}
                        </span>
                        <StatusDropdown
                          invoiceId={inv.id}
                          currentStatus={inv.status}
                          onUpdate={updateStatus}
                        />
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5 truncate">
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
                      <div className="font-extrabold text-[#0057FF] text-base">
                        {formatCurrency(ttc)}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-medium">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-[#0057FF] hover:bg-[#0057FF] hover:text-white transition-all"
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
