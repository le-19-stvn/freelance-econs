'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useClients } from '@/hooks/useClients'
import { useInvoices } from '@/hooks/useInvoices'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import type { Client, ClientStatus } from '@/types'
import { Users, X } from 'lucide-react'

type ClientStats = {
  totalBilled: number       // TTC toutes factures (hors draft)
  invoiceCount: number
  lastInvoiceDate: Date | null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  fiscal_id: '',
  sector: '',
  status: 'active' as ClientStatus,
}

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

/* ── Status presentation ─────────────────────────────── */
const statusPresentation: Record<
  ClientStatus,
  { label: string; textCls: string }
> = {
  active:   { label: 'Actif',    textCls: 'text-emerald-600' },
  prospect: { label: 'Prospect', textCls: 'text-blue-700' },
  inactive: { label: 'Inactif',  textCls: 'text-zinc-400' },
}

/* ── Tiny stat block used in the card grid ─────────── */
function StatCell({
  label,
  value,
  valueCls = 'text-zinc-900',
}: {
  label: string
  value: string
  valueCls?: string
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.08em] mb-1.5">
        {label}
      </div>
      <div className={`font-mono text-sm font-semibold tabular-nums ${valueCls}`}>
        {value}
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients()
  const { invoices } = useInvoices()
  const [showModal, setShowModal] = useState(false)

  // Aggregate stats per client (CA billed hors draft, facture count, last activity)
  const statsByClient = useMemo(() => {
    const map = new Map<string, ClientStats>()
    invoices.forEach(inv => {
      if (!inv.client_id || inv.status === 'draft') return
      const ht = calculateHT(inv.items ?? [])
      const ttc = calculateTTC(ht, inv.tva_rate)
      const prev = map.get(inv.client_id) ?? { totalBilled: 0, invoiceCount: 0, lastInvoiceDate: null }
      const issueDate = inv.issue_date ? new Date(inv.issue_date) : null
      map.set(inv.client_id, {
        totalBilled: prev.totalBilled + ttc,
        invoiceCount: prev.invoiceCount + 1,
        lastInvoiceDate:
          issueDate && (!prev.lastInvoiceDate || issueDate > prev.lastInvoiceDate)
            ? issueDate
            : prev.lastInvoiceDate,
      })
    })
    return map
  }, [invoices])

  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [nameError, setNameError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const openCreate = () => {
    setNameError('')
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (client: Client) => {
    setNameError('')
    setEditing(client)
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      fiscal_id: client.fiscal_id ?? '',
      sector: client.sector ?? '',
      status: client.status ?? 'active',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    if (form.name.trim().length < 2) {
      setNameError('Le nom doit contenir au moins 2 caracteres.')
      return
    }
    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      fiscal_id: form.fiscal_id || null,
      sector: form.sector || null,
      status: form.status,
    }
    try {
      if (editing) {
        await updateClient(editing.id, payload)
      } else {
        await createClient(payload)
      }
      setShowModal(false)
    } catch (err: any) {
      if (err?.error === 'LIMIT_REACHED') {
        setShowModal(false)
        setUpgradeMessage(err.message)
        setShowUpgrade(true)
      } else {
        console.error('Erreur lors de la sauvegarde du client:', err)
        alert(`Erreur: ${err?.message ?? err?.details ?? JSON.stringify(err)}`)
      }
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200/80 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-zinc-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-zinc-100 rounded mb-2" />
                  <div className="h-3 w-36 bg-zinc-50 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div className="h-8 bg-zinc-50 rounded" />
                <div className="h-8 bg-zinc-50 rounded" />
                <div className="h-8 bg-zinc-50 rounded" />
                <div className="h-8 bg-zinc-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Modal (portal) ── */
  const modalJSX = showModal ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated-lg p-8 w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-bold text-zinc-900 mb-6">
          {editing ? 'Modifier le client' : 'Nouveau client'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Nom *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`${inputCls} ${nameError ? '!ring-2 !ring-red-500/20 !border-red-500' : ''}`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* Sector + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Secteur</label>
              <input
                type="text"
                placeholder="Ex: Agence créative"
                value={form.sector}
                onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
                className={inputCls}
              >
                <option value="active">Actif</option>
                <option value="prospect">Prospect</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelCls}>Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* Fiscal ID */}
          <div>
            <label className={labelCls}>ID Fiscal</label>
            <input
              type="text"
              value={form.fiscal_id}
              onChange={(e) => setForm((f) => ({ ...f, fiscal_id: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2 justify-end">
            {editing && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('Etes-vous sur de vouloir supprimer ce client ?')) return
                  await deleteClient(editing.id)
                  setShowModal(false)
                }}
                className="rounded-xl bg-red-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-red-600 transition-all active:scale-[0.98] cursor-pointer"
              >
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl bg-zinc-100 text-zinc-900 px-4 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-all active:scale-[0.98] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.05]">
            Clients <span className="text-zinc-300 font-normal">—</span>{' '}
            <span className="text-zinc-400 font-medium">votre portefeuille.</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Suivi des relations, CA et factures par client.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600">
            <span className="font-mono tabular-nums text-zinc-900">{clients.length}</span>
            client{clients.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            Ajouter un client
          </button>
        </div>
      </div>

      {/* ═══ EMPTY STATE ═══ */}
      {clients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200/80">
          <Users size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-sm text-zinc-400">
            Prêt à ajouter votre premier client ?
          </p>
        </div>
      ) : (
        /* ═══ GRID ═══ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client, idx) => {
            const stats = statsByClient.get(client.id)
            const hasHistory = !!stats && stats.invoiceCount > 0
            const lastLabel = stats?.lastInvoiceDate
              ? stats.lastInvoiceDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              : '—'
            const status = client.status ?? 'active'
            const statusDef = statusPresentation[status]

            return (
              <div
                key={client.id}
                onClick={() => openEdit(client)}
                className={`bg-white rounded-2xl border border-zinc-200/80 p-6 cursor-pointer hover:border-zinc-300 hover:shadow-elevated transition-all group animate-fade-in animate-stagger-${Math.min(idx + 1, 8)}`}
              >
                {/* Header: avatar + name + sector */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-900 text-sm font-semibold shrink-0">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-zinc-900 truncate group-hover:text-zinc-700 transition-colors">
                      {client.name}
                    </h3>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {client.sector || client.email || '—'}
                    </p>
                  </div>
                </div>

                {/* Stats grid 2×2 */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-zinc-100">
                  <StatCell
                    label="Chiffre d'affaires"
                    value={hasHistory ? formatCurrency(stats!.totalBilled) : '—'}
                  />
                  <StatCell
                    label="Factures"
                    value={hasHistory ? String(stats!.invoiceCount) : '0'}
                  />
                  <StatCell
                    label="Dernière activité"
                    value={lastLabel}
                  />
                  <StatCell
                    label="Statut"
                    value={statusDef.label}
                    valueCls={statusDef.textCls}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {typeof document !== 'undefined' && createPortal(modalJSX, document.body)}
    </div>
  )
}
