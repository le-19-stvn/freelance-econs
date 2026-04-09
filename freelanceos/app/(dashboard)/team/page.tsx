'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useTeams, useTeamMembers, useTeamProjects, useTeamTasks } from '@/hooks/useTeams'
import { Users, Mail, X, FolderOpen, UserPlus } from 'lucide-react'
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

const inputCls = 'w-full px-4 py-3 rounded-[10px] bg-[#f5f5f5] border-0 text-sm text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 transition-all tracking-[-0.04em]'

/* ── Swiss Modal ── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[18px] shadow-xl p-6 w-full max-w-md relative border-0"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:bg-[#f5f5f5] hover:text-[#0a0a0a] transition-colors"
        >
          <X size={16} />
        </button>
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
    <div className="bg-white rounded-[10px] shadow-sm p-3 mb-2 relative hover:shadow-md border-0 transition-all">
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
        <div className="absolute top-8 right-2 z-10 bg-white rounded-[18px] shadow-lg border border-[#e7e7e7] p-1 min-w-[150px]">
          {columns.filter(c => c.key !== task.status).map(c => (
            <button
              key={c.key}
              onClick={() => { onMove(task.id, c.key); setShowMenu(false) }}
              className="block w-full text-left px-3 py-1.5 text-xs text-[#0a0a0a] rounded-[10px] hover:bg-[#f5f5f5]"
            >
              Deplacer &rarr; {c.label}
            </button>
          ))}
          <div className="border-t border-[#e7e7e7] my-1" />
          <div className="px-3 py-1 text-[11px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
            (Assigner)
          </div>
          {members.map(m => (
            <button
              key={m.user_id}
              onClick={() => { onAssign(task.id, m.user_id); setShowMenu(false) }}
              className={`block w-full text-left px-3 py-1.5 text-xs rounded-[10px] ${
                task.assigned_to === m.user_id ? 'bg-[#f5f5f5] text-[#0a0a0a] font-semibold' : 'text-[#0a0a0a] hover:bg-[#f5f5f5]'
              }`}
            >
              {m.full_name ?? m.email}
            </button>
          ))}
          {task.assigned_to && (
            <button
              onClick={() => { onAssign(task.id, null); setShowMenu(false) }}
              className="block w-full text-left px-3 py-1.5 text-xs text-[#0a0a0a]/60 rounded-[10px] hover:bg-[#f5f5f5]"
            >
              Retirer l&apos;assignation
            </button>
          )}
          <div className="border-t border-[#e7e7e7] my-1" />
          <button
            onClick={() => { onDelete(task.id); setShowMenu(false) }}
            className="block w-full text-left px-3 py-1.5 text-xs text-[#0a0a0a]/60 rounded-[10px] hover:bg-[#f5f5f5]"
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
          <span className="text-sm font-semibold text-[#0a0a0a] tracking-[-0.04em]">{colDef.label}</span>
          <span className="text-[10px] text-[#0a0a0a]/40 bg-[#f5f5f5] rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(colDef.key)}
          className="text-zinc-400 hover:text-[#0a0a0a] text-lg leading-none transition-colors"
          title="Ajouter une tache"
        >
          +
        </button>
      </div>
      <div className="bg-[#f5f5f5] rounded-[18px] p-3 min-h-[100px]">
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

  useEffect(() => {
    if (teams.length > 0 && !activeTeamId) setActiveTeamId(teams[0].id)
  }, [teams, activeTeamId])

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) setActiveProjectId(projects[0].id)
    else if (projects.length === 0) setActiveProjectId(null)
  }, [projects, activeProjectId])

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null

  const currentMember = members.find(m => m.user_id === currentUserId)
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  const openInviteModal = () => { setShowInvite(true); setFormError(null); setInviteEmail(''); setInviteRole('member') }

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

  /* ── Loading skeleton ── */
  if (teamsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-7 w-52 bg-zinc-200 rounded-[10px] mb-2" />
          <div className="h-4 w-36 bg-zinc-100 rounded-[10px] mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[18px] shadow-md p-5 h-24" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Empty state: no teams ── */
  if (teams.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-[18px] bg-[#f5f5f5] flex items-center justify-center mx-auto mb-5">
            <Users size={28} className="text-[#0a0a0a]/40" />
          </div>
          <h2 className="text-xl font-bold text-[#0a0a0a] mb-2 tracking-[-0.06em]">
            Gestion de l&apos;Equipe
          </h2>
          <p className="text-sm text-[#0a0a0a]/40 mb-8 leading-relaxed max-w-xs mx-auto">
            Collaborez avec d&apos;autres freelances sur des projets communs.
            Vos clients et factures restent prives.
          </p>
          <button
            onClick={() => { setShowCreateTeam(true); setFormError(null) }}
            className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-6 py-2.5 text-sm font-semibold hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer"
          >
            Creer une equipe
          </button>

          {showCreateTeam && (
            <Modal onClose={() => setShowCreateTeam(false)}>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-4 tracking-[-0.06em]">
                Nouvelle equipe
              </h3>
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Nom de l'equipe"
                className={inputCls + ' mb-4'}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
              />
              {formError && <div className="text-sm text-gray-600 mb-3">{formError}</div>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateTeam(false)} className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors cursor-pointer">Annuler</button>
                <button onClick={handleCreateTeam} disabled={formLoading} className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer">
                  {formLoading ? 'Creation...' : 'Creer'}
                </button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════
     MAIN LAYOUT
     ══════════════════════════════════════ */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-[-0.06em]">Gestion de l&apos;Equipe</h1>
          <p className="text-[13px] font-medium text-[#0a0a0a]/40 tracking-[-0.04em] mt-1">
            {members.length} membre(s) dans cette equipe
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={activeTeamId ?? ''}
            onChange={e => { setActiveTeamId(e.target.value); setActiveProjectId(null) }}
            className={inputCls + ' !w-auto'}
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>

          <button
            onClick={() => { setShowCreateTeam(true); setFormError(null) }}
            className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 hover:border-[#0a0a0a] hover:text-[#0a0a0a] px-3 py-2.5 text-sm font-medium transition-all cursor-pointer"
          >
            + Equipe
          </button>

          <button
            onClick={openInviteModal}
            className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-4 py-2.5 text-sm font-semibold hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <UserPlus size={15} />
            <span className="hidden sm:inline">Inviter un membre</span>
            <span className="sm:hidden">Inviter</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════
         SECTION 1: MEMBERS
         ══════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-[-0.04em]">Membres</h2>
        </div>

        {members.length === 0 ? (
          /* ── Beautiful empty state ── */
          <div className="rounded-[18px] border border-dashed border-[#e7e7e7] py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-[18px] bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-[#0a0a0a]/40" />
            </div>
            <p className="text-sm font-bold text-[#0a0a0a] mb-1 tracking-[-0.04em]">
              Aucun membre pour le moment
            </p>
            <p className="text-xs text-[#0a0a0a]/40 mb-5 max-w-[260px] mx-auto leading-relaxed">
              Invitez des collaborateurs pour commencer a travailler ensemble sur vos projets.
            </p>
            <button
              onClick={openInviteModal}
              className="rounded-full bg-[#0a0a0a] text-white px-5 py-2.5 text-sm font-semibold hover:bg-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <UserPlus size={15} />
              Inviter un membre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => {
              const isPending = m.status === 'pending'
              return (
                <div
                  key={m.user_id}
                  className={`flex items-center gap-3 bg-white rounded-[18px] p-4 transition-all ${
                    isPending
                      ? 'border border-dashed border-[#e7e7e7] opacity-75'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isPending ? 'bg-zinc-50 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {(m.full_name ?? m.email)?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0a0a0a] truncate">
                        {m.full_name ?? 'Sans nom'}
                      </span>
                      {isPending && (
                        <span className="shrink-0 inline-block px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[10px] font-semibold text-[#0a0a0a]/60">
                          En attente
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#0a0a0a]/40 truncate tracking-[-0.04em]">{m.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#0a0a0a]/40 font-medium">
                      {roleLabels[m.role] ?? m.role}
                    </span>
                    {canManage && m.user_id !== currentUserId && m.role !== 'owner' && (
                      <button
                        onClick={() => {
                          if (confirm('Retirer ce membre de l\'equipe ?')) {
                            removeMember(m.user_id)
                          }
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        title="Retirer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
         SECTION 2: PROJECTS
         ══════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-[-0.04em]">
            Projets
          </h2>
          <button
            onClick={() => { setShowCreateProject(true); setFormError(null) }}
            className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 hover:border-[#0a0a0a] hover:text-[#0a0a0a] px-3 py-2.5 text-sm font-medium transition-all cursor-pointer"
          >
            + Nouveau projet
          </button>
        </div>

        {projects.length === 0 ? (
          /* ── Beautiful empty state ── */
          <div className="rounded-[18px] border border-dashed border-[#e7e7e7] py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-[18px] bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={24} className="text-[#0a0a0a]/40" />
            </div>
            <p className="text-sm font-bold text-[#0a0a0a] mb-1 tracking-[-0.04em]">
              Aucun projet pour cette equipe
            </p>
            <p className="text-xs text-[#0a0a0a]/40 mb-5 max-w-[260px] mx-auto leading-relaxed">
              Creez un projet pour organiser le travail avec votre equipe.
            </p>
            <button
              onClick={() => { setShowCreateProject(true); setFormError(null) }}
              className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 hover:border-[#0a0a0a] hover:text-[#0a0a0a] px-5 py-2.5 text-sm font-medium transition-all cursor-pointer"
            >
              + Creer un projet
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                  p.id === activeProjectId
                    ? 'rounded-full bg-[#0a0a0a] text-white'
                    : 'rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 hover:border-[#0a0a0a]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {activeProject && (
          <div>
            <div className="flex items-center justify-between mb-4 pt-4 border-t border-[#e7e7e7]">
              <div>
                <h3 className="text-base font-bold text-[#0a0a0a] tracking-[-0.04em]">{activeProject.name}</h3>
                {activeProject.description && (
                  <p className="text-sm text-zinc-400 mt-1">{activeProject.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm('Supprimer ce projet et toutes ses taches ?')) {
                    deleteProject(activeProject.id)
                    setActiveProjectId(null)
                  }
                }}
                className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/40 hover:text-[#0a0a0a] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
              >
                Supprimer
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

      {/* Create Team Modal */}
      {showCreateTeam && (
        <Modal onClose={() => setShowCreateTeam(false)}>
          <h3 className="text-lg font-bold text-[#0a0a0a] mb-4 tracking-[-0.06em]">Nouvelle equipe</h3>
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Nom de l'equipe"
            className={inputCls + ' mb-4'}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
          />
          {formError && <div className="text-sm text-gray-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateTeam(false)} className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors cursor-pointer">Annuler</button>
            <button onClick={handleCreateTeam} disabled={formLoading} className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer">
              {formLoading ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <Modal onClose={() => setShowCreateProject(false)}>
          <h3 className="text-lg font-bold text-[#0a0a0a] mb-4 tracking-[-0.06em]">Nouveau projet</h3>
          <input
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="Nom du projet"
            className={inputCls + ' mb-3'}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
          />
          <textarea
            value={newProjectDesc}
            onChange={e => setNewProjectDesc(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className={inputCls + ' mb-4 resize-y'}
          />
          {formError && <div className="text-sm text-gray-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateProject(false)} className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors cursor-pointer">Annuler</button>
            <button onClick={handleCreateProject} disabled={formLoading} className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer">
              {formLoading ? 'Creation...' : 'Creer'}
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ INVITE MEMBER MODAL ═══ */}
      {showInvite && (
        <Modal onClose={() => setShowInvite(false)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[10px] bg-[#0a0a0a] flex items-center justify-center text-white shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a0a0a] tracking-[-0.06em]">Inviter un membre</h3>
              <p className="text-xs text-[#0a0a0a]/40 mt-0.5">L&apos;utilisateur doit deja avoir un compte Freelance.</p>
            </div>
          </div>

          <label className="block text-[13px] font-semibold text-[#0a0a0a]/60 tracking-[-0.04em] mb-1">Adresse email</label>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@exemple.com"
            type="email"
            className={inputCls + ' mb-4'}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
          />

          <label className="block text-[13px] font-semibold text-[#0a0a0a]/60 tracking-[-0.04em] mb-1">Role</label>
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className={inputCls + ' mb-5'}
          >
            <option value="admin">Admin</option>
            <option value="member">Membre</option>
          </select>

          {formError && <div className="text-sm text-gray-600 mb-3">{formError}</div>}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowInvite(false)} className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors cursor-pointer">
              Annuler
            </button>
            <button
              onClick={handleInvite}
              disabled={formLoading || !inviteEmail.trim()}
              className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer"
            >
              {formLoading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTask !== null && (
        <Modal onClose={() => setShowAddTask(null)}>
          <h3 className="text-lg font-bold text-[#0a0a0a] mb-4 tracking-[-0.06em]">
            Nouvelle tache — {columns.find(c => c.key === showAddTask)?.label}
          </h3>
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Titre de la tache"
            className={inputCls + ' mb-4'}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          />
          {formError && <div className="text-sm text-gray-600 mb-3">{formError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddTask(null)} className="rounded-full border border-[#e7e7e7] text-[#0a0a0a]/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#f5f5f5] transition-colors cursor-pointer">Annuler</button>
            <button onClick={handleAddTask} disabled={formLoading} className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50 hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all cursor-pointer">
              {formLoading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
