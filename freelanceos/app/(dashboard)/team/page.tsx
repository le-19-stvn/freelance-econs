'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useWorkspace } from '@/context/WorkspaceContext'
import type { WorkspaceRole } from '@/types'

interface MemberRow {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
  email: string
  full_name: string | null
}

const roleBadge: Record<WorkspaceRole, { bg: string; color: string; label: string }> = {
  owner: { bg: 'var(--blue-surface)', color: 'var(--blue-primary)', label: 'Propriétaire' },
  admin: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Admin' },
  member: { bg: '#F1F1F5', color: '#555', label: 'Membre' },
}

const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Membre' },
]

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

export default function TeamPage() {
  const supabase = createClient()
  const { activeWorkspaceId } = useWorkspace()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole | null>(null)

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspaceId) return
    setLoading(true)

    const userId = await getAuthUserId(supabase).catch(() => null)
    setCurrentUserId(userId)

    // Fetch members with a join on profiles for name/email
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, user_id, role, created_at, profile:profiles(email, full_name)')
      .eq('workspace_id', activeWorkspaceId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const rows: MemberRow[] = data.map((m: any) => ({
        workspace_id: m.workspace_id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        email: m.profile?.email ?? '',
        full_name: m.profile?.full_name ?? null,
      }))
      setMembers(rows)

      const me = rows.find((r) => r.user_id === userId)
      setCurrentUserRole(me?.role ?? null)
    }
    setLoading(false)
  }, [supabase, activeWorkspaceId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  const handleInvite = async () => {
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    if (!inviteEmail.trim()) {
      setInviteError('Veuillez entrer une adresse email')
      setInviting(false)
      return
    }

    // Look up the user by email in profiles
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim())
      .single()

    if (profileErr || !profile) {
      setInviteError("Aucun utilisateur trouvé avec cet email. L'utilisateur doit d'abord créer un compte.")
      setInviting(false)
      return
    }

    // Check if already a member
    const existing = members.find((m) => m.user_id === profile.id)
    if (existing) {
      setInviteError('Cet utilisateur est déjà membre de cet espace.')
      setInviting(false)
      return
    }

    // Insert membership
    const { error: insertErr } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: activeWorkspaceId,
        user_id: profile.id,
        role: inviteRole,
      })

    if (insertErr) {
      setInviteError(insertErr.message)
      setInviting(false)
      return
    }

    setInviteSuccess(`${inviteEmail} a été ajouté comme ${inviteRole === 'admin' ? 'Admin' : 'Membre'} !`)
    setInviteEmail('')
    setInviteRole('member')
    setInviting(false)
    await fetchMembers()
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Retirer ce membre de l\'espace de travail ?')) return

    await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', activeWorkspaceId!)
      .eq('user_id', userId)

    await fetchMembers()
  }

  if (!activeWorkspaceId) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun espace de travail sélectionné.</div>
  }

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
            Équipe
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
            {members.length} MEMBRE(S)
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowInvite(true)
              setInviteError(null)
              setInviteSuccess(null)
            }}
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
            + Inviter un membre
          </button>
        )}
      </div>

      {/* Members table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: canManage ? '1fr 1fr auto auto' : '1fr 1fr auto',
            gap: 16,
            padding: '12px 20px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg)',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>
            Membre
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>
            Email
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>
            Rôle
          </span>
          {canManage && (
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }} />
          )}
        </div>

        {/* Table rows */}
        {members.map((m) => {
          const badge = roleBadge[m.role]
          const isMe = m.user_id === currentUserId
          return (
            <div
              key={m.user_id}
              style={{
                display: 'grid',
                gridTemplateColumns: canManage ? '1fr 1fr auto auto' : '1fr 1fr auto',
                gap: 16,
                padding: '14px 20px',
                borderBottom: '1px solid var(--line)',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {(m.full_name ?? m.email)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                    {m.full_name ?? 'Sans nom'}
                    {isMe && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>
                        (vous)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{m.email}</div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: badge.bg,
                  color: badge.color,
                }}
              >
                {badge.label}
              </span>
              {canManage && (
                <div>
                  {m.role !== 'owner' && !isMe && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--danger-bg)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {members.length === 0 && (
          <div style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>
            Aucun membre dans cet espace.
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowInvite(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--line)',
              padding: 32,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
              Inviter un membre
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>
              L'utilisateur doit déjà avoir un compte FreelanceOS.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                Adresse email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collegue@email.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                Rôle
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                style={inputStyle}
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {inviteError && (
              <div style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div style={{ fontSize: 13, color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                {inviteSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--muted)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                style={{
                  background: 'var(--blue-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: inviting ? 'wait' : 'pointer',
                  opacity: inviting ? 0.6 : 1,
                }}
              >
                {inviting ? 'Ajout...' : 'Ajouter au workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
