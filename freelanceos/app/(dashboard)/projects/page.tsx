'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useProjects } from '@/hooks/useProjects'
import { useClients } from '@/hooks/useClients'
import { useInvoices } from '@/hooks/useInvoices'
import { useToast } from '@/components/ui/Toast'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectStatus, Deliverable, UnitType, TeamProject } from '@/types'
import { FolderOpen, Plus, Trash2, X } from 'lucide-react'

/* ── Helpers ── */
function getInitials(name: string | null | undefined, fallback = '—') {
  if (!name) return fallback
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return '—'
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

/* ── Types shared with team scope ── */
type TeamProjectWithTeam = TeamProject & { team_name: string; member_count: number }

type UnifiedProject =
  | {
      kind: 'solo'
      id: string
      name: string
      clientName: string
      status: ProjectStatus
      prestationsTotal: number   // HT sum of deliverables
      billed: number
      deadline: string | null
      deliverableCount: number
      memberCount: number
      memberInitials: string[]
      project: Project
    }
  | {
      kind: 'team'
      id: string
      name: string
      clientName: string // = team name
      status: 'ongoing' // team projects don't have our status today
      prestationsTotal: 0
      billed: 0
      deadline: null
      deliverableCount: 0
      memberCount: number
      memberInitials: string[]
      teamProject: TeamProjectWithTeam
    }

type TabKey = 'all' | 'ongoing' | 'paused' | 'done' | 'archived'

const TAB_ORDER: { key: TabKey; label: string }[] = [
  { key: 'all',      label: 'Tous' },
  { key: 'ongoing',  label: 'En cours' },
  { key: 'paused',   label: 'En pause' },
  { key: 'done',     label: 'Terminés' },
  { key: 'archived', label: 'Archivés' },
]

/* ── Status badge colors (mockup): blue=en cours, amber=pause, emerald=terminé, zinc=archivé ── */
const statusBadge: Record<ProjectStatus | 'team', { label: string; cls: string }> = {
  ongoing:  { label: 'En cours',  cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  paused:   { label: 'En pause',  cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  done:     { label: 'Terminé',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  archived: { label: 'Archivé',   cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  team:     { label: 'Équipe',    cls: 'bg-violet-50 text-violet-700 border-violet-100' },
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

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all'
const labelCls = 'block text-xs font-medium text-zinc-500 mb-1.5'

/* ── Small building blocks ─────────────────────────── */

function Pill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 whitespace-nowrap">
      <span className="font-mono tabular-nums text-zinc-900">{value}</span>
      {label}
    </span>
  )
}

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

function StatusChip({ kind }: { kind: ProjectStatus | 'team' }) {
  const cfg = statusBadge[kind]
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  )
}

function MemberStack({ initials, count }: { initials: string[]; count: number }) {
  const shown = initials.slice(0, 3)
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {shown.map((ini, i) => (
          <span
            key={i}
            className="w-6 h-6 rounded-md bg-violet-100 text-violet-700 text-[10px] font-semibold flex items-center justify-center border border-white ring-1 ring-zinc-200/60"
          >
            {ini}
          </span>
        ))}
      </div>
      <span className="text-xs text-zinc-400">
        {count} membre{count > 1 ? 's' : ''}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { clients } = useClients()
  const { invoices } = useInvoices()
  const { showToast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [nameError, setNameError] = useState('')
  const [deadlineError, setDeadlineError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [teamProjects, setTeamProjects] = useState<TeamProjectWithTeam[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [userInitials, setUserInitials] = useState<string>('')

  /* ── Fetch: current user initials for solo project avatar ── */
  useEffect(() => {
    let canceled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name, email')
        .eq('id', user.id)
        .single()
      if (canceled) return
      const src = profile?.full_name || profile?.company_name || profile?.email || ''
      setUserInitials(getInitials(src, 'ME'))
    })()
    return () => { canceled = true }
  }, [])

  /* ── Fetch: team projects + member counts ── */
  useEffect(() => {
    let canceled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      const teamIds = (memberships ?? []).map((m: any) => m.team_id)
      if (teamIds.length === 0) { if (!canceled) setTeamProjects([]); return }

      const [{ data: tp }, { data: allMembers }] = await Promise.all([
        supabase
          .from('team_projects')
          .select('*, team:teams(name)')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('team_members')
          .select('team_id')
          .in('team_id', teamIds)
          .eq('status', 'active'),
      ])

      // Count active members per team
      const memberCountByTeam = new Map<string, number>()
      ;(allMembers ?? []).forEach((m: any) => {
        memberCountByTeam.set(m.team_id, (memberCountByTeam.get(m.team_id) ?? 0) + 1)
      })

      if (canceled) return
      const rows: TeamProjectWithTeam[] = (tp ?? []).map((r: any) => ({
        id: r.id,
        team_id: r.team_id,
        name: r.name,
        description: r.description,
        created_at: r.created_at,
        team_name: r.team?.name ?? 'Équipe',
        member_count: memberCountByTeam.get(r.team_id) ?? 1,
      }))
      setTeamProjects(rows)
    })()
    return () => { canceled = true }
  }, [])

  /* ── Facturé par projet (TTC hors draft) ── */
  const billedByProject = useMemo(() => {
    const map = new Map<string, number>()
    invoices.forEach(inv => {
      if (!inv.project_id || inv.status === 'draft') return
      const ht = calculateHT(inv.items ?? [])
      const ttc = calculateTTC(ht, inv.tva_rate)
      map.set(inv.project_id, (map.get(inv.project_id) ?? 0) + ttc)
    })
    return map
  }, [invoices])

  /* ── Unified project list (solo + team) ── */
  const unified: UnifiedProject[] = useMemo(() => {
    const solo: UnifiedProject[] = projects.map(p => {
      const deliverables = p.deliverables ?? []
      const prestationsTotal = deliverables.reduce(
        (sum, d) => sum + d.quantity * d.unit_price,
        0
      )
      return {
        kind: 'solo' as const,
        id: p.id,
        name: p.name,
        clientName: p.client?.name ?? '—',
        status: p.status,
        prestationsTotal,
        billed: billedByProject.get(p.id) ?? 0,
        deadline: p.deadline,
        deliverableCount: deliverables.length,
        memberCount: 1,
        memberInitials: userInitials ? [userInitials] : ['LM'],
        project: p,
      }
    })
    const team: UnifiedProject[] = teamProjects.map(tp => ({
      kind: 'team' as const,
      id: tp.id,
      name: tp.name,
      clientName: tp.team_name,
      status: 'ongoing' as const,
      prestationsTotal: 0,
      billed: 0,
      deadline: null,
      deliverableCount: 0,
      memberCount: tp.member_count,
      memberInitials: [tp.team_name[0]?.toUpperCase() ?? 'T'],
      teamProject: tp,
    }))
    return [...solo, ...team]
  }, [projects, teamProjects, billedByProject, userInitials])

  /* ── Tab counts (solo only, team lives outside status taxonomy) ── */
  const counts = useMemo(() => {
    const base = { all: 0, ongoing: 0, paused: 0, done: 0, archived: 0 }
    projects.forEach(p => {
      base.all += 1
      if (p.status in base) base[p.status as keyof typeof base] += 1
    })
    // Team projects are always visible in "Tous" and "En cours"
    base.all += teamProjects.length
    base.ongoing += teamProjects.length
    return base
  }, [projects, teamProjects])

  const filtered = useMemo(() => {
    if (activeTab === 'all') return unified
    if (activeTab === 'ongoing') {
      return unified.filter(u => u.status === 'ongoing')
    }
    return unified.filter(u => u.kind === 'solo' && u.status === activeTab)
  }, [unified, activeTab])

  /* ── Modal open/close ── */
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
          showToast('Projet terminé ! Facture brouillon générée avec les prestations.', 'success')
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

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200/80 p-6 animate-pulse">
              <div className="h-4 w-48 bg-zinc-100 rounded mb-2" />
              <div className="h-3 w-24 bg-zinc-50 rounded mb-5" />
              <div className="h-2 w-full bg-zinc-100 rounded mb-4" />
              <div className="grid grid-cols-3 gap-4">
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

  /* ═══ RENDER ═══ */
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.05]">
            Projets <span className="text-zinc-300 font-normal">—</span>{' '}
            <span className="text-zinc-400 font-medium">vos missions en cours.</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Suivez l&apos;avancement, les budgets et les échéances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Pill label="actifs" value={counts.ongoing} />
          <Pill label="terminés" value={counts.done} />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <span className="text-base leading-none">+</span>
            Nouveau projet
          </button>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      {counts.all > 0 && (
        <div className="mb-5 border-b border-zinc-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 min-w-max">
            {TAB_ORDER.map(tab => {
              const active = activeTab === tab.key
              const count = counts[tab.key]
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active ? 'text-blue-700' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                  <span className={`font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded ${
                    active ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-blue-700" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {counts.all === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200/80">
          <FolderOpen size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-sm text-zinc-400">
            Prêt à démarrer un nouveau projet ?
          </p>
        </div>
      ) : (
        /* ═══ GRID ═══ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((u, idx) => {
            const isTeam = u.kind === 'team'
            const hasPrestations = !isTeam && u.prestationsTotal > 0
            const pct = hasPrestations
              ? Math.min(100, Math.round((u.billed / u.prestationsTotal) * 100))
              : 0
            const overBudget = hasPrestations && u.billed > u.prestationsTotal
            const barCls = overBudget
              ? 'bg-red-500'
              : u.status === 'done'
                ? 'bg-emerald-500'
                : u.status === 'paused'
                  ? 'bg-amber-500'
                  : 'bg-blue-700'

            const card = (
              <div
                className={`bg-white rounded-2xl border border-zinc-200/80 p-6 hover:border-zinc-300 hover:shadow-elevated transition-all group animate-fade-in animate-stagger-${Math.min(idx + 1, 8)}`}
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className="text-base font-bold text-zinc-900 truncate group-hover:text-zinc-700 transition-colors">
                    {u.name}
                  </h3>
                  <StatusChip kind={isTeam ? 'team' : u.status} />
                </div>
                <p className="text-sm text-zinc-500 truncate mb-5">
                  {u.clientName}
                </p>

                {/* Progress bar (solo only, if deliverables priced) */}
                {hasPrestations && (
                  <div className="mb-5">
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${barCls}`}
                        style={{ width: `${Math.max(pct, u.billed > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        <span className="font-mono tabular-nums text-zinc-700 font-semibold">{pct}%</span> facturé
                      </span>
                      <span className="font-mono tabular-nums text-zinc-500">
                        <span className={overBudget ? 'text-red-600 font-semibold' : 'text-zinc-900 font-semibold'}>
                          {formatCurrency(u.billed)}
                        </span>
                        <span className="text-zinc-400"> / {formatCurrency(u.prestationsTotal)}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Stats row (solo with prestations) */}
                {!isTeam && hasPrestations && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
                    <StatCell label="Prestations" value={formatCurrency(u.prestationsTotal)} />
                    <StatCell
                      label="Facturé"
                      value={formatCurrency(u.billed)}
                      valueCls={overBudget ? 'text-red-600' : 'text-zinc-900'}
                    />
                    <StatCell label="Échéance" value={formatDeadline(u.deadline)} />
                  </div>
                )}

                {/* Stats row (solo without prestations — fallback) */}
                {!isTeam && !hasPrestations && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
                    <StatCell label="Lignes"      value={String(u.deliverableCount)} />
                    <StatCell label="Prestations" value="—" />
                    <StatCell label="Échéance"    value={formatDeadline(u.deadline)} />
                  </div>
                )}

                {/* Stats row (team — no budget/deadline concept yet) */}
                {isTeam && (
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500">
                      Projet collaboratif — voir le détail dans{' '}
                      <span className="text-blue-700 font-medium">/team</span>
                    </p>
                  </div>
                )}

                {/* Footer: members */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100">
                  <MemberStack initials={u.memberInitials} count={u.memberCount} />
                </div>
              </div>
            )

            if (isTeam) {
              return (
                <Link key={`team-${u.id}`} href="/team" className="block cursor-pointer">
                  {card}
                </Link>
              )
            }

            return (
              <div
                key={`solo-${u.id}`}
                onClick={() => openEdit(u.project)}
                className="cursor-pointer"
              >
                {card}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-elevated-lg p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-bold text-zinc-900 mb-6">
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
                  className={`${inputCls} ${nameError ? '!border-red-500 !ring-red-500/20' : ''}`}
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
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
                    <option value="paused">En pause</option>
                    <option value="done">Terminé</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className={`${inputCls} ${deadlineError ? '!border-red-500 !ring-red-500/20' : ''}`}
                  />
                  {deadlineError && <p className="text-xs text-red-500 mt-1">{deadlineError}</p>}
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

              {/* Deliverables */}
              <div className="border-t border-zinc-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-zinc-900">
                    Prestations
                  </label>
                  <button
                    type="button"
                    onClick={addDeliverable}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    Ajouter une ligne
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 mb-3">
                  Ces lignes seront automatiquement reportées sur la facture quand le projet sera terminé.
                </p>

                {deliverables.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
                    <p className="text-xs text-zinc-400">Aucune prestation définie.</p>
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      + Ajouter une prestation
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {deliverables.map((d, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          {idx === 0 && <label className="block text-[10px] font-medium text-zinc-400 mb-1">Description</label>}
                          <input
                            type="text"
                            placeholder="Ex: Maquettes UX"
                            value={d.description}
                            onChange={(e) => updateDeliverable(idx, 'description', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <label className="block text-[10px] font-medium text-zinc-400 mb-1">Qté</label>}
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={d.quantity}
                            onChange={(e) => updateDeliverable(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </div>
                        <div className="col-span-2">
                          {idx === 0 && <label className="block text-[10px] font-medium text-zinc-400 mb-1">Unité</label>}
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
                        <div className="col-span-2">
                          {idx === 0 && <label className="block text-[10px] font-medium text-zinc-400 mb-1">Prix unit.</label>}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={d.unit_price}
                            onChange={(e) => updateDeliverable(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className={inputCls}
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeDeliverable(idx)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {deliverables.some(d => d.description.trim()) && (
                      <div className="flex justify-end pt-2 border-t border-zinc-100">
                        <span className="text-sm font-bold text-zinc-900">
                          Total HT : {formatCurrency(deliverables.reduce((sum, d) => sum + d.quantity * d.unit_price, 0))}
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
        </div>,
        document.body
      )}
    </div>
  )
}
