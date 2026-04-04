'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useClients } from '@/hooks/useClients'
import { useToast } from '@/components/ui/Toast'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import type { Project, ProjectStatus, Deliverable, UnitType } from '@/types'
import { FolderOpen, Calendar, DollarSign, Plus, Trash2, X } from 'lucide-react'

const statusConfig: Record<ProjectStatus, { bg: string; text: string; label: string }> = {
  done: { bg: 'bg-gray-900', text: 'text-white', label: 'Termine' },
  ongoing: { bg: 'bg-[#00A3FF]/10', text: 'text-[#0057FF]', label: 'En cours' },
}

const emptyForm = {
  name: '',
  client_id: '',
  description: '',
  status: 'ongoing' as ProjectStatus,
  deadline: '',
  budget: '',
}

const emptyDeliverable: Deliverable = { description: '', quantity: 1, unit: 'h' as UnitType, unit_price: 0 }

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-[#00A3FF] focus:ring-1 focus:ring-[#00A3FF]/20 transition-all'
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5'

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { clients } = useClients()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [nameError, setNameError] = useState('')
  const [deadlineError, setDeadlineError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const openCreate = () => {
    setNameError('')
    setDeadlineError('')
    setEditing(null)
    setForm(emptyForm)
    setDeliverables([])
    setShowModal(true)
  }

  const openEdit = (project: Project) => {
    setNameError('')
    setDeadlineError('')
    setEditing(project)
    setForm({
      name: project.name,
      client_id: project.client_id ?? '',
      description: project.description ?? '',
      status: project.status,
      deadline: project.deadline ?? '',
      budget: String(project.budget ?? ''),
    })
    setDeliverables(project.deliverables ?? [])
    setShowModal(true)
  }

  /* ── Deliverable row helpers ── */
  const addDeliverable = () => setDeliverables(prev => [...prev, { ...emptyDeliverable }])
  const removeDeliverable = (idx: number) => setDeliverables(prev => prev.filter((_, i) => i !== idx))
  const updateDeliverable = (idx: number, field: keyof Deliverable, value: string | number) => {
    setDeliverables(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    setDeadlineError('')

    let hasError = false
    if (form.name.trim().length < 2) {
      setNameError('Le nom doit contenir au moins 2 caracteres.')
      hasError = true
    }
    if (form.deadline) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (new Date(form.deadline) < today) {
        setDeadlineError('La deadline doit etre aujourd\'hui ou dans le futur.')
        hasError = true
      }
    }
    if (hasError) return

    // Filter out empty deliverables
    const validDeliverables = deliverables.filter(d => d.description.trim() !== '')

    const payload = {
      name: form.name,
      client_id: form.client_id || null,
      description: form.description || null,
      status: form.status,
      deadline: form.deadline || null,
      budget: parseFloat(form.budget) || 0,
      deliverables: validDeliverables,
    }
    try {
      if (editing) {
        const result = await updateProject(editing.id, payload)
        if (result.invoiceGenerated) {
          showToast('Projet termine ! Facture brouillon generee avec les prestations.', 'success')
        }
      } else {
        await createProject(payload)
      }
      setShowModal(false)
    } catch (err: any) {
      if (err?.error === 'LIMIT_REACHED') {
        setShowModal(false)
        setUpgradeMessage(err.message)
        setShowUpgrade(true)
      } else {
        console.error('Erreur lors de la sauvegarde du projet:', err)
        alert('Une erreur est survenue lors de la sauvegarde du projet.')
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
              <div className="h-10 w-10 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Projets
          </h1>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">
            {projects.length} projet(s) enregistre(s)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Nouveau Projet
        </button>
      </div>

      {/* ═══ PROJECT GRID ═══ */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-400">
            Pret a demarrer un nouveau projet ?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const badge = statusConfig[project.status]
            const delCount = (project.deliverables ?? []).length
            return (
              <div
                key={project.id}
                onClick={() => openEdit(project)}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-[#00A3FF]/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A3FF] to-[#0057FF] flex items-center justify-center text-white">
                    <FolderOpen size={18} />
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-gray-900 truncate mb-1 group-hover:text-[#0057FF] transition-colors">
                  {project.name}
                </h3>

                <p className="text-sm text-gray-500 truncate mb-4">
                  {project.client?.name ?? '---'}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(project.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {project.budget > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} />
                      {project.budget.toLocaleString('fr-FR')} EUR
                    </div>
                  )}
                  {delCount > 0 && (
                    <div className="text-[#0057FF] font-medium">
                      {delCount} prestation(s)
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
            className="bg-white rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {editing ? 'Modifier le projet' : 'Nouveau projet'}
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
                  className={`${inputCls} ${nameError ? '!border-gray-400 !ring-gray-200' : ''}`}
                />
                {nameError && <p className="text-xs text-gray-600 mt-1">{nameError}</p>}
              </div>

              {/* Client */}
              <div>
                <label className={labelCls}>Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">-- Aucun --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </div>

              {/* Status + Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                    className={inputCls}
                  >
                    <option value="ongoing">En cours</option>
                    <option value="done">Termine</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className={`${inputCls} ${deadlineError ? '!border-gray-400 !ring-gray-200' : ''}`}
                  />
                  {deadlineError && <p className="text-xs text-gray-600 mt-1">{deadlineError}</p>}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className={labelCls}>Budget</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* ═══ DELIVERABLES ═══ */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                    Prestations
                  </label>
                  <button
                    type="button"
                    onClick={addDeliverable}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057FF] hover:text-[#00A3FF] transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Ajouter une ligne
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 mb-3">
                  Ces lignes seront automatiquement reportees sur la facture quand le projet sera termine.
                </p>

                {deliverables.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-400">Aucune prestation definie.</p>
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="mt-2 text-xs font-semibold text-[#0057FF] hover:text-[#00A3FF] transition-colors cursor-pointer"
                    >
                      + Ajouter une prestation
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {deliverables.map((d, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        {/* Description — 5 cols */}
                        <div className="col-span-5">
                          {idx === 0 && <label className="block text-[10px] font-medium text-gray-400 mb-1">Description</label>}
                          <input
                            type="text"
                            placeholder="Ex: Maquettes UX"
                            value={d.description}
                            onChange={(e) => updateDeliverable(idx, 'description', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        {/* Quantity — 2 cols */}
                        <div className="col-span-2">
                          {idx === 0 && <label className="block text-[10px] font-medium text-gray-400 mb-1">Qte</label>}
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={d.quantity}
                            onChange={(e) => updateDeliverable(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </div>
                        {/* Unit — 2 cols */}
                        <div className="col-span-2">
                          {idx === 0 && <label className="block text-[10px] font-medium text-gray-400 mb-1">Unite</label>}
                          <select
                            value={d.unit}
                            onChange={(e) => updateDeliverable(idx, 'unit', e.target.value)}
                            className={inputCls}
                          >
                            <option value="h">Heure</option>
                            <option value="jour">Jour</option>
                            <option value="forfait">Forfait</option>
                          </select>
                        </div>
                        {/* Unit Price — 2 cols */}
                        <div className="col-span-2">
                          {idx === 0 && <label className="block text-[10px] font-medium text-gray-400 mb-1">Prix unit.</label>}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={d.unit_price}
                            onChange={(e) => updateDeliverable(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </div>
                        {/* Delete — 1 col */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeDeliverable(idx)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    {deliverables.some(d => d.description.trim()) && (
                      <div className="flex justify-end pt-2 border-t border-gray-100">
                        <span className="text-sm font-bold text-gray-900">
                          Total HT : {deliverables.reduce((sum, d) => sum + d.quantity * d.unit_price, 0).toLocaleString('fr-FR')} EUR
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2 justify-end">
                {editing && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Etes-vous sur de vouloir supprimer ce projet ?')) return
                      await deleteProject(editing.id)
                      setShowModal(false)
                    }}
                    className="text-gray-500 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
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
