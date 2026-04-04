'use client'

import { useState } from 'react'
import { useClients } from '@/hooks/useClients'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import type { Client } from '@/types'
import { Users, Mail, Phone, MapPin } from 'lucide-react'

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

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#00A3FF] focus:ring-1 focus:ring-[#00A3FF]/20 transition-all'
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5'

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
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-full" />
                <div>
                  <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-36 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Clients
          </h1>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">
            {clients.length} client(s) enregistre(s)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Nouveau Client
        </button>
      </div>

      {/* ═══ CLIENT GRID ═══ */}
      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-400" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Pret a ajouter votre premier client ?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => openEdit(client)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-[#00A3FF]/40 transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#0057FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(client.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0057FF] transition-colors" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                    {client.name}
                  </h3>
                  {client.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 truncate">
                      <Mail size={11} className="shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra info row */}
              {(client.phone || client.address) && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
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

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-xl"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
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
                    className={`${inputCls} ${field.key === 'name' && nameError ? '!border-red-400 !ring-red-200' : ''}`}
                  />
                  {field.key === 'name' && nameError && (
                    <p className="text-xs text-red-600 mt-1">{nameError}</p>
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
                    className="text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {editing ? 'Enregistrer' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
