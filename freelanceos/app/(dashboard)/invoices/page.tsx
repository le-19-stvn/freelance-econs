'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/hooks/useInvoices'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import type { InvoiceStatus } from '@/types'

const statusBadge: Record<InvoiceStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: '#F1F1F5', color: '#555', label: 'Brouillon' },
  sent: { bg: 'var(--blue-surface)', color: 'var(--blue-primary)', label: 'Envoyee' },
  paid: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Payee' },
  late: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'En retard' },
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function PdfButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLoading(true)
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
    // Reset after a short delay (download triggers in new tab)
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
        textDecoration: 'none',
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

export default function InvoicesPage() {
  const { invoices, loading } = useInvoices()

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
            {invoices.length} FACTURE(S) ENREGISTREE(S)
          </div>
        </div>
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

      {/* Invoice List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {invoices.map((inv) => {
          const badge = statusBadge[inv.status]
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                {/* Doc Icon */}
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
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                    {inv.client?.name ?? '---'}
                    {inv.project?.name && (
                      <span> &middot; {inv.project.name}</span>
                    )}
                  </div>
                </div>
              </div>

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

                {/* Download PDF button — always visible */}
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
          Aucune facture enregistree.
        </div>
      )}
    </div>
  )
}
