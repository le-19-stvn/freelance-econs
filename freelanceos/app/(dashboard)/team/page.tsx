'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useTeams, useTeamMembers, useTeamProjects, useTeamTasks } from '@/hooks/useTeams'
import type { Team, TeamProject, TeamTask, TaskStatus, TeamMember } from '@/types'

/* ── Constants ── */
const columns: { key: TaskStatus; label: string; color: string; bg: string }[] = [
  { key: 'todo', label: 'À faire', color: '#6B7280', bg: '#F3F4F6' },
  { key: 'in_progress', label: 'En cours', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'done', label: 'Terminé', color: '#059669', bg: '#ECFDF5' },
]

const roleLabels: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Admin',
  member: 'Membre',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  fontSize: 14,
  outline: 'none',
  background: 'var(--bg)',
  color: 'var(--ink)',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--blue-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  background: 'var(--bg)',
  color: 'var(--muted)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
}

/* ── Modal Wrapper ── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 12,
          border: '1px solid var(--line)', padding: 28,
          width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Kanban Card ── */
function TaskCard({
  task,
  members,
  onMove,
  onAssign,
  onDelete,
}: {
  task: TeamTask
  members: TeamMember[]
  onMove: (id: string, status: TaskStatus) => void
  onAssign: (id: string, userId: string | null) => void
  onDelete: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 8,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>
          {task.title}
        </span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 4px', fontSize: 16, color: 'var(--muted)', lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ···
        </button>
      </div>

      {/* Assignee badge */}
      {task.assignee_name && (
        <div style={{
          marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'var(--bg)', borderRadius: 4, padding: '2px 8px',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 8, fontWeight: 700,
          }}>
            {task.assignee_name[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{task.assignee_name}</span>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute', top: 32, right: 8, zIndex: 10,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            padding: 4, minWidth: 160,
          }}
        >
          {/* Move options */}
          {columns.filter(c => c.key !== task.status).map(c => (
            <button
              key={c.key}
              onClick={() => { onMove(task.id, c.key); setShowMenu(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', padding: '7px 12px',
                fontSize: 12, color: 'var(--ink)', cursor: 'pointer', borderRadius: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              → {c.label}
            </button>
          ))}

          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />

          {/* Assign options */}
          <div style={{ padding: '4px 12px 2px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Assigner
          </div>
          {members.map(m => (
            <button
              key={m.user_id}
              onClick={() => { onAssign(task.id, m.user_id); setShowMenu(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: task.assigned_to === m.user_id ? 'var(--blue-surface)' : 'none',
                border: 'none', padding: '7px 12px',
                fontSize: 12, color: 'var(--ink)', cursor: 'pointer', borderRadius: 4,
              }}
              onMouseEnter={e => { if (task.assigned_to !== m.user_id) e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (task.assigned_to !== m.user_id) e.currentTarget.style.background = 'none' }}
            >
              {m.full_name ?? m.email}
            </button>
          ))}
          {task.assigned_to && (
            <button
              onClick={() => { onAssign(task.id, null); setShowMenu(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', padding: '7px 12px',
                fontSize: 12, color: 'var(--danger)', cursor: 'pointer', borderRadius: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg, #FEE2E2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Retirer l'assignation
            </button>
          )}

          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />

          <button
            onClick={() => { onDelete(task.id); setShowMenu(false) }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', padding: '7px 12px',
              fontSize: 12, color: 'var(--danger)', cursor: 'pointer', borderRadius: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg, #FEE2E2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Kanban Column ── */
function KanbanColumn({
  colDef,
  tasks,
  members,
  onMove,
  onAssign,
  onDelete,
  onAddTask,
}: {
  colDef: typeof columns[0]
  tasks: TeamTask[]
  members: TeamMember[]
  onMove: (id: string, status: TaskStatus) => void
  onAssign: (id: string, userId: string | null) => void
  onDelete: (id: string) => void
  onAddTask: (status: TaskStatus) => void
}) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, padding: '0 2px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: colDef.color,
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            {colDef.label}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--muted)',
            background: 'var(--bg)', borderRadius: 10, padding: '1px 8px',
          }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(colDef.key)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: 'var(--muted)', lineHeight: 1, padding: '0 4px',
          }}
          title="Ajouter une tâche"
        >
          +
        </button>
      </div>

      {/* Cards container */}
      <div style={{
        background: colDef.bg,
        borderRadius: 10,
        padding: 8,
        minHeight: 120,
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            onMove={onMove}
            onAssign={onAssign}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{
            padding: '24px 0', textAlign: 'center',
            fontSize: 12, color: 'var(--muted)',
          }}>
            Aucune tâche
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function TeamPage() {
  const supabase = createClient()
  const { teams, loading: teamsLoading, fetchTeams, createTeam } = useTeams()

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { members, addMember, removeMember } = useTeamMembers(activeTeamId)
  const { projects, fetchProjects, createProject, deleteProject } = useTeamProjects(activeTeamId)
  const { tasks, createTask, updateTaskStatus, assignTask, deleteTask } = useTeamTasks(activeProjectId)

  // Modals
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showAddTask, setShowAddTask] = useState<TaskStatus | null>(null)

  // Form state
  const [newTeamName, setNewTeamName] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    getAuthUserId(supabase).then(setCurrentUserId).catch(() => {})
  }, [supabase])

  // Auto-select first team
  useEffect(() => {
    if (teams.length > 0 && !activeTeamId) setActiveTeamId(teams[0].id)
  }, [teams, activeTeamId])

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) setActiveProjectId(projects[0].id)
    else if (projects.length === 0) setActiveProjectId(null)
  }, [projects, activeProjectId])

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null

  const currentMember = members.find(m => m.user_id === currentUserId)
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  /* ── Handlers ── */
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setFormLoading(true)
    setFormError(null)
    try {
      await createTeam(newTeamName.trim())
      await fetchTeams()
      setNewTeamName('')
      setShowCreateTeam(false)
    } catch (e: any) { setFormError(e.message) }
    setFormLoading(false)
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    setFormLoading(true)
    setFormError(null)
    try {
      const p = await createProject(newProjectName.trim(), newProjectDesc.trim())
      setActiveProjectId(p.id)
      setNewProjectName('')
      setNewProjectDesc('')
      setShowCreateProject(false)
    } catch (e: any) { setFormError(e.message) }
    setFormLoading(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setFormLoading(true)
    setFormError(null)
    try {
      await addMember(inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      setInviteRole('member')
      setShowInvite(false)
    } catch (e: any) { setFormError(e.message) }
    setFormLoading(false)
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !showAddTask) return
    setFormLoading(true)
    setFormError(null)
    try {
      await createTask(newTaskTitle.trim(), showAddTask)
      setNewTaskTitle('')
      setShowAddTask(null)
    } catch (e: any) { setFormError(e.message) }
    setFormLoading(false)
  }

  /* ── Empty state ── */
  if (teamsLoading) {
    return <div style={{ color: 'var(--muted)', fontSize: 14, padding: 20 }}>Chargement...</div>
  }

  if (teams.length === 0) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          <Users size={48} style={{ color: 'var(--muted)' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 8px' }}>
          Freelance Collective
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
          Collaborez avec d'autres freelances sur des projets communs.
          Vos clients et factures restent privés.
        </p>
        <button
          onClick={() => { setShowCreateTeam(true); setFormError(null) }}
          style={btnPrimary}
        >
          Créer une équipe
        </button>

        {showCreateTeam && (
          <Modal onClose={() => setShowCreateTeam(false)}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 16px' }}>
              Nouvelle équipe
            </h3>
            <input
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="Nom de l'équipe"
              style={{ ...inputStyle, marginBottom: 16 }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
            />
            {formError && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{formError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateTeam(false)} style={btnSecondary}>Annuler</button>
              <button onClick={handleCreateTeam} disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.6 : 1 }}>
                {formLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  /* ── Main layout ── */
  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 120px)' }}>
      {/* ── Left sidebar: teams + projects ── */}
      <div style={{
        width: 260, minWidth: 260, flexShrink: 0,
        borderRight: '1px solid var(--line)',
        background: 'var(--surface)',
        borderRadius: '12px 0 0 12px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Team selector */}
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>
              Équipes
            </span>
            <button
              onClick={() => { setShowCreateTeam(true); setFormError(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', lineHeight: 1 }}
              title="Nouvelle équipe"
            >
              +
            </button>
          </div>
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => { setActiveTeamId(team.id); setActiveProjectId(null) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', borderRadius: 6, marginBottom: 2,
                border: 'none', cursor: 'pointer',
                background: team.id === activeTeamId ? 'var(--blue-surface)' : 'transparent',
                color: team.id === activeTeamId ? 'var(--blue-primary)' : 'var(--ink)',
                fontWeight: team.id === activeTeamId ? 600 : 400,
                fontSize: 13,
              }}
            >
              {team.name}
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: 'var(--line)', margin: '0 16px' }} />

        {/* Team projects */}
        {activeTeam && (
          <div style={{ padding: '12px 16px', flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>
                Projets
              </span>
              <button
                onClick={() => { setShowCreateProject(true); setFormError(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', lineHeight: 1 }}
                title="Nouveau projet"
              >
                +
              </button>
            </div>
            {projects.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>Aucun projet</div>
            )}
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', borderRadius: 6, marginBottom: 2,
                  border: 'none', cursor: 'pointer',
                  background: p.id === activeProjectId ? 'var(--blue-surface)' : 'transparent',
                  color: p.id === activeProjectId ? 'var(--blue-primary)' : 'var(--ink)',
                  fontWeight: p.id === activeProjectId ? 600 : 400,
                  fontSize: 13,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--line)', margin: '0 16px' }} />

        {/* Team members */}
        {activeTeam && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>
                Membres ({members.length})
              </span>
              {canManage && (
                <button
                  onClick={() => { setShowInvite(true); setFormError(null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)', lineHeight: 1 }}
                  title="Inviter"
                >
                  +
                </button>
              )}
            </div>
            {members.map(m => (
              <div key={m.user_id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 0', fontSize: 12,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 9, fontWeight: 700,
                }}>
                  {(m.full_name ?? m.email)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span style={{ color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.full_name ?? m.email}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {roleLabels[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Kanban board ── */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
        {!activeProject ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
              {projects.length === 0 ? 'Créez un projet pour commencer.' : 'Sélectionnez un projet.'}
            </div>
            {projects.length === 0 && (
              <button
                onClick={() => { setShowCreateProject(true); setFormError(null) }}
                style={btnPrimary}
              >
                + Nouveau projet
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Project header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  {activeProject.name}
                </h2>
                {activeProject.description && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                    {activeProject.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm('Supprimer ce projet et toutes ses tâches ?')) {
                    deleteProject(activeProject.id)
                    setActiveProjectId(null)
                  }
                }}
                style={{ ...btnSecondary, color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Supprimer
              </button>
            </div>

            {/* Kanban columns */}
            <div style={{ display: 'flex', gap: 16 }}>
              {columns.map(col => (
                <KanbanColumn
                  key={col.key}
                  colDef={col}
                  tasks={tasks.filter(t => t.status === col.key)}
                  members={members}
                  onMove={updateTaskStatus}
                  onAssign={assignTask}
                  onDelete={deleteTask}
                  onAddTask={(status) => { setShowAddTask(status); setFormError(null); setNewTaskTitle('') }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ Modals ══ */}

      {showCreateTeam && (
        <Modal onClose={() => setShowCreateTeam(false)}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 16px' }}>
            Nouvelle équipe
          </h3>
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Nom de l'équipe"
            style={{ ...inputStyle, marginBottom: 16 }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
          />
          {formError && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreateTeam(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleCreateTeam} disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.6 : 1 }}>
              {formLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {showCreateProject && (
        <Modal onClose={() => setShowCreateProject(false)}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 16px' }}>
            Nouveau projet
          </h3>
          <input
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="Nom du projet"
            style={{ ...inputStyle, marginBottom: 12 }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
          />
          <textarea
            value={newProjectDesc}
            onChange={e => setNewProjectDesc(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            style={{ ...inputStyle, marginBottom: 16, resize: 'vertical' }}
          />
          {formError && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreateProject(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleCreateProject} disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.6 : 1 }}>
              {formLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {showInvite && (
        <Modal onClose={() => setShowInvite(false)}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
            Inviter un membre
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
            L'utilisateur doit déjà avoir un compte Freelance.
          </p>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@exemple.com"
            type="email"
            style={{ ...inputStyle, marginBottom: 12 }}
            autoFocus
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          >
            <option value="admin">Admin</option>
            <option value="member">Membre</option>
          </select>
          {formError && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowInvite(false)} style={btnSecondary}>Annuler</button>
            <button onClick={handleInvite} disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.6 : 1 }}>
              {formLoading ? 'Ajout...' : 'Inviter'}
            </button>
          </div>
        </Modal>
      )}

      {showAddTask !== null && (
        <Modal onClose={() => setShowAddTask(null)}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 16px' }}>
            Nouvelle tâche — {columns.find(c => c.key === showAddTask)?.label}
          </h3>
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Titre de la tâche"
            style={{ ...inputStyle, marginBottom: 16 }}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          />
          {formError && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddTask(null)} style={btnSecondary}>Annuler</button>
            <button onClick={handleAddTask} disabled={formLoading} style={{ ...btnPrimary, opacity: formLoading ? 0.6 : 1 }}>
              {formLoading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ── Icon (imported inline to avoid extra deps) ── */
function Users({ size = 24, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
