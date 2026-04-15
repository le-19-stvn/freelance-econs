'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useClients } from '@/hooks/useClients'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import type { Client } from '@/types'
import { Users, Mail, Phone, MapPin, X } from 'lucide-react'

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
}

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

export default function ClientsPage() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients()
  const [showModal, setShowModal] = useState(false)
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-elevated p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-zinc-100 rounded-xl" />
                <div>
                  <div className="h-4 w-28 bg-zinc-100 rounded mb-2" />
                  <div className="h-3 w-36 bg-zinc-50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Modal JSX (rendered via portal) ──
  const modalJSX = showModal ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated-lg p-8 w-full max-w-md mx-4 relative"
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
          {[
            { key: 'name', label: 'Nom *', required: true, type: 'text' },
            { key: 'email', label: 'Email', required: false, type: 'email' },
            { key: 'phone', label: 'Telephone', required: false, type: 'tel' },
            { key: 'address', label: 'Adresse', required: false, type: 'text' },
            { key: 'fiscal_id', label: 'ID Fiscal', required: false, type: 'text' },
          ].map((field) => (
            <div key={field.key}>
              <label className={labelCls}>{field.label}</label>
              <input
                type={field.type}
                required={field.required}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className={`${inputCls} ${field.key === 'name' && nameError ? '!ring-2 !ring-red-500/20 !border-red-500' : ''}`}
              />
              {field.key === 'name' && nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
            </div>
          ))}

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
              className="rounded-xl bg-blue-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {editing ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Clients
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {clients.length} client(s) enregistre(s)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          + Nouveau Client
        </button>
      </div>

      {/* ═══ CLIENT GRID ═══ */}
      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-sm text-zinc-400">
            Pret a ajouter votre premier client ?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, idx) => (
            <div
              key={client.id}
              onClick={() => openEdit(client)}
              className={`bg-white rounded-2xl shadow-elevated p-5 cursor-pointer hover:shadow-elevated-lg transition-all group animate-fade-in animate-stagger-${Math.min(idx + 1, 8)}`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(client.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900 truncate group-hover:text-zinc-500 transition-colors">
                    {client.name}
                  </h3>
                  {client.email && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 truncate">
                      <Mail size={11} className="shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra info row */}
              {(client.phone || client.address) && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-400">
                  {client.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={11} />
                      {client.phone}
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODAL (rendered via Portal to escape stacking context) ═══ */}
      {typeof document !== 'undefined' && createPortal(modalJSX, document.body)}
    </div>
  )
}
