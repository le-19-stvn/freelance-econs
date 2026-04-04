'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useTeams, useTeamMembers, useTeamProjects, useTeamTasks } from '@/hooks/useTeams'
import type { TeamTask, TaskStatus, TeamMember } from '@/types'

/* ── Constants ── */
const columns: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'A faire' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done', label: 'Termine' },
]

const roleLabels: Record<string, string> = {
  owner: 'Proprietaire',
  admin: 'Admin',
  member: 'Membre',
}

/* ── Simple Modal ── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        {children}
      </div>
    </div>
  )
}

/* ── Task Card ── */
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
    <div className="bg-white border border-gray-200 rounded p-3 mb-2 relative">
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm text-gray-900">{task.title}</span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-400 hover:text-gray-600 text-sm px-1 shrink-0"
        >
          ...
        </button>
      </div>

      {task.assignee_name && (
        <div className="mt-2 text-xs text-gray-500">
          Assigne a : {task.assignee_name}
        </div>
      )}

      {showMenu && (
        <div className="absolute top-8 right-2 z-10 bg-white border border-gray-200 rounded p-1 min-w-[150px]">
          {columns.filter(c => c.key !== task.status).map(c => (
            <button
              key={c.key}
              onClick={() => { onMove(task.id, c.key); setShowMenu(false) }}
              className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded"
            >
              Deplacer → {c.label}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Assigner
          </div>
          {members.map(m => (
            <button
              key={m.user_id}
              onClick={() => { onAssign(task.id, m.user_id); setShowMenu(false) }}
              className={`block w-full text-left px-3 py-1.5 text-xs rounded ${
                task.assigned_to === m.user_id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {m.full_name ?? m.email}
            </button>
          ))}
          {task.assigned_to && (
            <button
              onClick={() => { onAssign(task.id, null); setShowMenu(false) }}
              className="block w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
            >
              Retirer l&apos;assignation
            </button>
          )}
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onDelete(task.id); setShowMenu(false) }}
            className="block w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
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
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{colDef.label}</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(colDef.key)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="Ajouter une tache"
        >
          +
        </button>
      </div>
      <div className="bg-gray-50 rounded-lg p-2 min-h-[100px]">
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
          <div className="text-center text-xs text-gray-400 py-6">Aucune tache</div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
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

  /* ── Loading ── */
  if (teamsLoading) {
    return <div className="text-gray-400 text-sm p-4">Chargement...</div>
  }

  /* ── Empty state: no teams ── */
  if (teams.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <UsersIcon size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Gestion de l&apos;Equipe</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Collaborez avec d&apos;autres freelances sur des projets communs.
          Vos clients et factures restent prives.
        </p>
        <button
          onClick={() => { setShowCreateTeam(true); setFormError(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700"
        >
          Creer une equipe
        </button>

        {showCreateTeam && (
          <Modal onClose={() => setShowCreateTeam(false)}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvelle equipe</h3>
            <input
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="Nom de l'equipe"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
            />
            {formError && <div className="text-sm text-red-600 mb-3">{formError}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreateTeam(false)} className="border border-gray-300 text-gray-500 px-4 py-2 rounded text-sm font-semibold">Annuler</button>
              <button onClick={handleCreateTeam} disabled={formLoading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">
                {formLoading ? 'Creation...' : 'Creer'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  /* ══════════════════════════════════════
     MAIN LAYOUT — Full width, no sidebar
     ══════════════════════════════════════ */
  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de l&apos;Equipe</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} membre(s) dans cette equipe</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Team Selector */}
          <select
            value={activeTeamId ?? ''}
            onChange={e => { setActiveTeamId(e.target.value); setActiveProjectId(null) }}
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>

          <button
            onClick={() => { setShowCreateTeam(true); setFormError(null) }}
            className="border border-gray-300 text-gray-600 px-3 py-2 rounded text-sm font-semibold hover:bg-gray-50"
          >
            + Equipe
          </button>
        </div>
      </div>

      {/* ══════════════════════════════
         SECTION 1: MEMBERS (Priority)
         ══════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Membres</h2>
          {canManage && (
            <button
              onClick={() => { setShowInvite(true); setFormError(null) }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700"
            >
              + Inviter un membre
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun membre dans cette equipe.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <div
                key={m.user_id}
                className="flex items-center gap-3 border border-gray-200 rounded-lg p-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
                  {(m.full_name ?? m.email)?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {m.full_name ?? 'Sans nom'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{m.email}</div>
                </div>

                {/* Role + Remove */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">
                    {roleLabels[m.role] ?? m.role}
                  </span>
                  {canManage && m.user_id !== currentUserId && m.role !== 'owner' && (
                    <button
                      onClick={() => {
                        if (confirm('Retirer ce membre de l\'equipe ?')) {
                          removeMember(m.user_id)
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                      title="Retirer"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
         SECTION 2: PROJECTS LINKED TO TEAM
         ══════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Projets associes a cette equipe
          </h2>
          <button
            onClick={() => { setShowCreateProject(true); setFormError(null) }}
            className="border border-gray-300 text-gray-600 px-3 py-2 rounded text-sm font-semibold hover:bg-gray-50"
          >
            + Nouveau projet
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun projet pour cette equipe.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`px-4 py-2 rounded text-sm font-medium border ${
                  p.id === activeProjectId
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Selected project: Kanban */}
        {activeProject && (
          <div>
            <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{activeProject.name}</h3>
                {activeProject.description && (
                  <p className="text-sm text-gray-500 mt-1">{activeProject.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm('Supprimer ce projet et toutes ses taches ?')) {
                    deleteProject(activeProject.id)
                    setActiveProjectId(null)
                  }
                }}
                className="text-xs text-red-500 border border-red-300 px-3 py-1.5 rounded hover:bg-red-50"
              >
                Supprimer le projet
              </button>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
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
          </div>
        )}
      </div>

      {/* ══════════════════
         MODALS
         ══════════════════ */}

      {showCreateTeam && (
        <Modal onClose={() => setShowCreateTeam(false)}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvelle equipe</h3>
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Nom de l'equipe"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
          />
          {formError && <div className="text-sm text-red-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateTeam(false)} className="border border-gray-300 text-gray-500 px-4 py-2 rounded text-sm font-semibold">Annuler</button>
            <button onClick={handleCreateTeam} disabled={formLoading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">
              {formLoading ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </Modal>
      )}

      {showCreateProject && (
        <Modal onClose={() => setShowCreateProject(false)}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Nouveau projet</h3>
          <input
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="Nom du projet"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 outline-none focus:border-blue-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
          />
          <textarea
            value={newProjectDesc}
            onChange={e => setNewProjectDesc(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500 resize-y"
          />
          {formError && <div className="text-sm text-red-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateProject(false)} className="border border-gray-300 text-gray-500 px-4 py-2 rounded text-sm font-semibold">Annuler</button>
            <button onClick={handleCreateProject} disabled={formLoading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">
              {formLoading ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </Modal>
      )}

      {showInvite && (
        <Modal onClose={() => setShowInvite(false)}>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Inviter un membre</h3>
          <p className="text-sm text-gray-500 mb-4">L&apos;utilisateur doit deja avoir un compte Freelance.</p>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@exemple.com"
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 outline-none focus:border-blue-500"
            autoFocus
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500 bg-white"
          >
            <option value="admin">Admin</option>
            <option value="member">Membre</option>
          </select>
          {formError && <div className="text-sm text-red-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowInvite(false)} className="border border-gray-300 text-gray-500 px-4 py-2 rounded text-sm font-semibold">Annuler</button>
            <button onClick={handleInvite} disabled={formLoading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">
              {formLoading ? 'Ajout...' : 'Inviter'}
            </button>
          </div>
        </Modal>
      )}

      {showAddTask !== null && (
        <Modal onClose={() => setShowAddTask(null)}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Nouvelle tache — {columns.find(c => c.key === showAddTask)?.label}
          </h3>
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Titre de la tache"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          />
          {formError && <div className="text-sm text-red-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddTask(null)} className="border border-gray-300 text-gray-500 px-4 py-2 rounded text-sm font-semibold">Annuler</button>
            <button onClick={handleAddTask} disabled={formLoading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">
              {formLoading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ── Icon ── */
function UsersIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
