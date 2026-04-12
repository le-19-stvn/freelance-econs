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

const inputCls = 'w-full px-4 py-3 rounded-[10px] bg-[#f5f5f5] border-0 text-sm text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 transition-all tracking-[-0.04em]'
const labelCls = 'block text-[13px] font-semibold text-[#0a0a0a]/60 mb-1.5 tracking-[-0.04em]'

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
            <div key={i} className="bg-white rounded-[18px] shadow-md p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#e7e7e7] rounded-full" />
                <div>
                  <div className="h-4 w-28 bg-[#e7e7e7] rounded-full mb-2" />
                  <div className="h-3 w-36 bg-[#f5f5f5] rounded-full" />
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
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-[-0.06em]">
            Clients
          </h1>
          <p className="text-[13px] font-medium text-[#0a0a0a]/40 tracking-[-0.04em] mt-1">
            {clients.length} client(s) enregistre(s)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-sm font-semibold px-6 py-2.5 hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer"
        >
          + Nouveau Client
        </button>
      </div>

      {/* ═══ CLIENT GRID ═══ */}
      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-[#0a0a0a]/20 mb-4" />
          <p className="text-sm text-[#0a0a0a]/40">
            Pret a ajouter votre premier client ?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => openEdit(client)}
              className="bg-white rounded-[18px] shadow-md p-5 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(client.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#0a0a0a] tracking-[-0.04em] truncate group-hover:text-[#0a0a0a]/60 transition-colors">
                    {client.name}
                  </h3>
                  {client.email && (
                    <div className="flex items-center gap-1.5 text-xs text-[#0a0a0a]/40 mt-0.5 truncate">
                      <Mail size={11} className="shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra info row */}
              {(client.phone || client.address) && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#e7e7e7] text-xs text-[#0a0a0a]/40">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] shadow-xl p-8 w-full max-w-md mx-4"
          >
            <h2 className="text-lg font-bold text-[#0a0a0a] mb-6 tracking-[-0.06em]">
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
                    className={`${inputCls} ${field.key === 'name' && nameError ? '!ring-2 !ring-[#0a0a0a]/20' : ''}`}
                  />
                  {field.key === 'name' && nameError && (
                    <p className="text-xs text-[#0a0a0a]/60 mt-1">{nameError}</p>
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
                    className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-6 py-2.5 text-sm font-semibold hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all"
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
