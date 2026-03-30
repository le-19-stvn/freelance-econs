'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useClients } from '@/hooks/useClients'
import { useToast } from '@/components/ui/Toast'
import type { Project, ProjectStatus } from '@/types'

const statusConfig: Record<ProjectStatus, { bg: string; color: string; label: string }> = {
  done: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Termine' },
  ongoing: { bg: 'var(--blue-surface)', color: 'var(--blue-primary)', label: 'En cours' },
}

const emptyForm = {
  name: '',
  client_id: '',
  description: '',
  status: 'ongoing' as ProjectStatus,
  deadline: '',
  budget: '',
}

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { clients } = useClients()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [nameError, setNameError] = useState('')
  const [deadlineError, setDeadlineError] = useState('')

  const openCreate = () => {
    setNameError('')
    setDeadlineError('')
    setEditing(null)
    setForm(emptyForm)
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
    setShowModal(true)
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

    const payload = {
      name: form.name,
      client_id: form.client_id || null,
      description: form.description || null,
      status: form.status,
      deadline: form.deadline || null,
      budget: parseFloat(form.budget) || 0,
    }
    try {
      if (editing) {
        const result = await updateProject(editing.id, payload)
        if (result.invoiceGenerated) {
          showToast('Projet terminé ! Une facture brouillon a été générée.', 'success')
        }
      } else {
        await createProject(payload)
      }
      setShowModal(false)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du projet:', err)
      alert('Une erreur est survenue lors de la sauvegarde du projet.')
    }
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
            Projets
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
            {projects.length} PROJET(S) ENREGISTRE(S)
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: 'var(--blue-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + Nouveau Projet
        </button>
      </div>

      {/* Project Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        {projects.map((project) => {
          const badge = statusConfig[project.status]
          return (
            <div
              key={project.id}
              onClick={() => openEdit(project)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--blue-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--ink)',
                        fontSize: 15,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                    {project.client?.name ?? '---'}
                    {project.deadline && (
                      <span style={{ marginLeft: 8 }}>
                        &middot; {new Date(project.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 20 }}>
          Aucun projet enregistre.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 32,
              width: 480,
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--ink)',
                marginTop: 0,
                marginBottom: 20,
              }}
            >
              {editing ? 'Modifier le projet' : 'Nouveau projet'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${nameError ? 'var(--danger)' : 'var(--line)'}`,
                    fontSize: 14,
                    outline: 'none',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                  }}
                />
                {nameError && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{nameError}</div>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                  Client
                </label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    fontSize: 14,
                    outline: 'none',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Aucun --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    fontSize: 14,
                    outline: 'none',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      fontSize: 14,
                      outline: 'none',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="ongoing">En cours</option>
                    <option value="done">Termine</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${deadlineError ? 'var(--danger)' : 'var(--line)'}`,
                      fontSize: 14,
                      outline: 'none',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                  {deadlineError && (
                    <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{deadlineError}</div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                  Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    fontSize: 14,
                    outline: 'none',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                {editing && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Etes-vous sur de vouloir supprimer ce projet ?')) return
                      await deleteProject(editing.id)
                      setShowModal(false)
                    }}
                    style={{
                      background: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 18px',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--muted)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--blue-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
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
