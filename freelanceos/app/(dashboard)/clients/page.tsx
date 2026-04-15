'use client'

import { useState } from 'react'
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

// J'ai légèrement réduit le padding vertical (py-2.5 au lieu de py-3) pour affiner les champs
const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-semibold text-zinc-600 mb-1.5'

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
      setNameError('Le nom doit contenir au moins 2 caractères.')
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

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clients</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {clients.length} client(s) enregistré(s)
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
          <p className="text-sm text-zinc-400">Prêt à ajouter votre premier client ?</p>
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
                <div className="w-11 h-11 rounded-xl bg-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(client.name)}
                </div>
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

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            // Remplacement de max-w-md par max-w-lg pour avoir une modale mieux proportionnée
            className="bg-white rounded-2xl shadow-elevated-lg p-6 sm:p-8 w-full max-w-lg relative animate-fade-in"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                {editing ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {editing ? 'Mettez à jour les informations ci-dessous.' : 'Renseignez les détails de votre nouveau contact.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Ligne 1 : Nom */}
              <div>
                <label className={labelCls}>Nom complet ou Entreprise *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={`${inputCls} ${nameError ? '!ring-2 !ring-red-500/20 !border-red-500' : ''}`}
                  placeholder="Ex: Acme Corp ou Jean Dupont"
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>

              {/* Ligne 2 : Email */}
              <div>
                <label className={labelCls}>Adresse Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                  placeholder="contact@exemple.com"
                />
              </div>

              {/* Ligne 3 : Téléphone & ID Fiscal sur deux colonnes (Grille) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputCls}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div>
                  <label className={labelCls}>ID Fiscal (SIRET/TVA)</label>
                  <input
                    type="text"
                    value={form.fiscal_id}
                    onChange={(e) => setForm((f) => ({ ...f, fiscal_id: e.target.value }))}
                    className={inputCls}
                    placeholder="FR123456789"
                  />
                </div>
              </div>

              {/* Ligne 4 : Adresse */}
              <div>
                <label className={labelCls}>Adresse Postale</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className={inputCls}
                  placeholder="123 rue de la Paix, 75000 Paris"
                />
              </div>

              {/* Actions (Boutons séparés : Danger à gauche, Actions à droite) */}
              <div className="flex items-center justify-between mt-4 pt-6 border-t border-zinc-100">
                <div>
                  {editing && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ? Toutes ses factures associées pourraient être impactées.')) return
                        await deleteClient(editing.id)
                        setShowModal(false)
                      }}
                      // Bouton fantôme rouge pour la suppression (moins agressif visuellement)
                      className="rounded-xl text-red-600 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-all active:scale-[0.98]"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl bg-zinc-100 text-zinc-900 px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-all active:scale-[0.98]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-700 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    {editing ? 'Enregistrer' : 'Créer le client'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
