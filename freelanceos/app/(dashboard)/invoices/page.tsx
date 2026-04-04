'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import type { Invoice, InvoiceStatus } from '@/types'

const statusBadge: Record<InvoiceStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: '#F1F1F5', color: '#555', label: 'Brouillon' },
  sent: { bg: 'var(--blue-surface)', color: 'var(--blue-primary)', label: 'Envoyée' },
  paid: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Payée' },
  late: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'En retard' },
}

/* ── Icons ── */
function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

/* ── Inline Toast ── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 20px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: type === 'success' ? 'var(--success)' : 'var(--danger)',
        background: type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
        border: `1px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {type === 'success' ? '✓' : '✕'} {message}
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
      onError("Le client n'a pas d'adresse email configurée")
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

      onSuccess(`Email envoyé à ${invoice.client.name} !`)
    } catch {
      onError("Erreur réseau lors de l'envoi")
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      title={invoice.client?.email ? `Envoyer à ${invoice.client.email}` : "Pas d'email client"}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: invoice.client?.email ? 'var(--success-bg)' : '#F1F1F5',
        color: invoice.client?.email ? 'var(--success)' : '#999',
        border: 'none',
        borderRadius: 6,
        padding: '8px 12px',
        fontWeight: 600,
        fontSize: 12,
        cursor: sending ? 'wait' : invoice.client?.email ? 'pointer' : 'not-allowed',
        opacity: sending ? 0.6 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!sending && invoice.client?.email) {
          e.currentTarget.style.background = 'var(--success)'
          e.currentTarget.style.color = '#fff'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = invoice.client?.email ? 'var(--success-bg)' : '#F1F1F5'
        e.currentTarget.style.color = invoice.client?.email ? 'var(--success)' : '#999'
      }}
    >
      <SendIcon />
      {sending ? 'Envoi...' : 'Email'}
    </button>
  )
}

/* ── Status transition map ── */
type Transition = { to: InvoiceStatus; label: string; icon: string }

function getTransitions(current: InvoiceStatus): Transition[] {
  switch (current) {
    case 'draft':
      return [
        { to: 'sent', label: 'Marquer comme Envoyée', icon: '📤' },
        { to: 'paid', label: 'Marquer comme Payée', icon: '✅' },
      ]
    case 'sent':
      return [
        { to: 'paid', label: 'Marquer comme Payée', icon: '✅' },
        { to: 'late', label: 'Marquer en Retard', icon: '⚠️' },
        { to: 'draft', label: 'Remettre en Brouillon', icon: '📝' },
      ]
    case 'paid':
      return [
        { to: 'draft', label: 'Remettre en Brouillon', icon: '📝' },
      ]
    case 'late':
      return [
        { to: 'paid', label: 'Marquer comme Payée', icon: '✅' },
        { to: 'sent', label: 'Remettre en Envoyée', icon: '📤' },
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
      title="Télécharger le PDF"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--blue-surface)',
        color: 'var(--blue-primary)',
        border: 'none',
        borderRadius: 6,
        padding: '8px 12px',
        fontWeight: 600,
        fontSize: 12,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = 'var(--blue-primary)'
          e.currentTarget.style.color = '#fff'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--blue-surface)'
        e.currentTarget.style.color = 'var(--blue-primary)'
      }}
    >
      <DownloadIcon />
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

  // Close on outside click
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (transitions.length > 0) setOpen(!open)
        }}
        disabled={updating || transitions.length === 0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: badge.bg,
          color: badge.color,
          border: 'none',
          cursor: transitions.length > 0 ? 'pointer' : 'default',
          opacity: updating ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {updating ? '...' : badge.label}
        {transitions.length > 0 && <ChevronDownIcon />}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            zIndex: 50,
            minWidth: 230,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              color: 'var(--muted)',
              borderBottom: '1px solid var(--line)',
            }}
          >
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--ink)',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: targetBadge.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{t.label}</span>
                <CheckIcon />
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
    fetchInvoices() // Refresh to get updated status
  }

  const handleEmailError = (msg: string) => {
    setToast({ message: msg, type: 'error' })
  }

  const handleExportCSV = () => {
    // Escape values containing semicolons, double quotes, or newlines
    const esc = (v: string) =>
      /[;\n\r"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

    const header = 'Numéro;Client;Date;Montant;Statut'
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

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement...</div>
  }

  return (
    <div>
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
            Factures
          </h1>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: 'var(--muted)',
              marginTop: 4,
            }}
          >
            {invoices.length} FACTURE(S) ENREGISTRÉE(S)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExportCSV}
            disabled={invoices.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 14,
              cursor: invoices.length === 0 ? 'not-allowed' : 'pointer',
              opacity: invoices.length === 0 ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (invoices.length > 0) e.currentTarget.style.borderColor = 'var(--blue-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)'
            }}
          >
            <DownloadIcon />
            Exporter
          </button>
          <Link
            href="/invoices/new"
            style={{
              background: 'var(--blue-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + Nouvelle Facture
          </Link>
        </div>
      </div>

      {/* Invoice List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {invoices.map((inv) => {
          const ht = calculateHT(inv.items ?? [])
          const ttc = calculateTTC(ht, inv.tva_rate)
          return (
            <div
              key={inv.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--blue-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)'
              }}
            >
              {/* Left side — icon + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--blue-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="var(--blue-primary)"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--ink)',
                        fontFamily: 'monospace',
                        fontSize: 14,
                      }}
                    >
                      {inv.invoice_number}
                    </span>
                    {/* Status badge dropdown */}
                    <StatusDropdown
                      invoiceId={inv.id}
                      currentStatus={inv.status}
                      onUpdate={updateStatus}
                    />
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                    {inv.client?.name ?? '---'}
                    {inv.project?.name && (
                      <span> &middot; {inv.project.name}</span>
                    )}
                    {inv.issue_date && (
                      <span style={{ marginLeft: 8, fontSize: 11 }}>
                        &middot; {new Date(inv.issue_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side — amount + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--blue-primary)',
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(ttc)}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase' }}>
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
                  style={{
                    background: 'var(--blue-surface)',
                    color: 'var(--blue-primary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--blue-primary)'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--blue-surface)'
                    e.currentTarget.style.color = 'var(--blue-primary)'
                  }}
                >
                  Voir
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {invoices.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 20 }}>
          Aucune facture enregistrée.
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
