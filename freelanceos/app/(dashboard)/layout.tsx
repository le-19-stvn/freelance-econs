'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useState, useRef, useEffect } from 'react'
import { Menu, X, ChevronDown, Users, Plus } from 'lucide-react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { createWorkspace } from '@/lib/actions/workspace'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9.12 0A4 4 0 0016 8a4 4 0 00-4-4 4 4 0 00-4 4 4 4 0 000 8m0 0a4 4 0 013 3.87M15 8a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Factures',
    href: '/invoices',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Équipe',
    href: '/team',
    icon: <Users size={18} />,
  },
  {
    label: 'Profil',
    href: '/profile',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projets',
  '/invoices': 'Factures',
  '/team': 'Équipe',
  '/profile': 'Profil',
}

/* ── Create Workspace Modal ── */
function CreateWorkspaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Veuillez entrer un nom.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const newId = await createWorkspace(trimmed)
      onCreated(newId)
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la création.')
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--line)',
          padding: 32,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
          Créer une équipe
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>
          Un nouvel espace de travail pour collaborer.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Nom de l&apos;équipe
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Agence Web, Studio Design…"
            autoFocus
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
              marginBottom: 20,
            }}
          />

          {error && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--danger)',
                background: 'var(--danger-bg)',
                padding: '8px 12px',
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                background: 'var(--blue-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 13,
                cursor: creating ? 'wait' : 'pointer',
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Workspace Switcher ── */
function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, loading, refetch } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const active = workspaces.find((w) => w.id === activeWorkspaceId)

  if (loading || workspaces.length === 0) return null

  return (
    <>
      <div ref={ref} style={{ position: 'relative', margin: '0 24px 12px' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            transition: 'border-color 0.15s',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {active?.name ?? 'Espace de travail'}
          </span>
          <ChevronDown size={14} style={{ flexShrink: 0, color: 'var(--muted)' }} />
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '6px 12px',
                fontSize: 9,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: 'var(--muted)',
                borderBottom: '1px solid var(--line)',
              }}
            >
              Vos espaces
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  border: 'none',
                  background: ws.id === activeWorkspaceId ? 'var(--blue-surface)' : 'transparent',
                  color: ws.id === activeWorkspaceId ? 'var(--blue-primary)' : 'var(--ink)',
                  fontWeight: ws.id === activeWorkspaceId ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (ws.id !== activeWorkspaceId) e.currentTarget.style.background = 'var(--bg)'
                }}
                onMouseLeave={(e) => {
                  if (ws.id !== activeWorkspaceId) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: ws.id === activeWorkspaceId ? 'var(--blue-primary)' : 'var(--line)',
                    flexShrink: 0,
                  }}
                />
                {ws.name}
              </button>
            ))}

            {/* Create workspace button */}
            <button
              onClick={() => {
                setOpen(false)
                setShowCreate(true)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                border: 'none',
                borderTop: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--blue-primary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--blue-surface)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Plus size={14} style={{ flexShrink: 0 }} />
              Créer une équipe
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={async (newId) => {
            setShowCreate(false)
            await refetch()
            setActiveWorkspaceId(newId)
          }}
        />
      )}
    </>
  )
}

function SidebarContent({
  pathname,
  isActive,
  onNavigate,
}: {
  pathname: string
  isActive: (href: string) => boolean
  onNavigate?: () => void
}) {
  return (
    <>
      <div>
        {/* Logo */}
        <div style={{ padding: '24px 24px 20px' }}>
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/assets/logo_freelance.png"
              alt="FreelanceOS Logo"
              width={40}
              height={40}
              className="flex-shrink-0"
              style={{ borderRadius: 10 }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--ink)',
                letterSpacing: -0.5,
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                lineHeight: 1.1,
              }}
            >
              Freelance
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: 'var(--muted)',
              marginTop: 2,
              paddingLeft: 53,
            }}
          >
            by eCons
          </div>
        </div>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher />

        {/* Nav */}
        <nav style={{ marginTop: 8 }}>
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--blue-primary)' : 'var(--muted)',
                  background: active ? 'var(--blue-surface)' : 'transparent',
                  borderLeft: active
                    ? '2px solid var(--blue-primary)'
                    : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom user avatar */}
      <div style={{ padding: '20px 24px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00B4D8 0%, #1A3FA3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          F
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const currentTitle = pageTitles[pathname] ?? 'eCons Freelance'

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <aside
        className="hidden md:flex flex-col justify-between flex-shrink-0"
        style={{
          width: 240,
          minWidth: 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--line)',
        }}
      >
        <SidebarContent pathname={pathname} isActive={isActive} />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          {/* Drawer */}
          <aside
            className="relative flex flex-col justify-between h-full"
            style={{
              width: 280,
              background: 'var(--surface)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md"
              style={{ color: 'var(--muted)' }}
            >
              <X size={20} />
            </button>
            <SidebarContent
              pathname={pathname}
              isActive={isActive}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-4 md:px-8"
          style={{
            height: 56,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-1 rounded-md"
              style={{ color: 'var(--ink)' }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 16 }}>
              {currentTitle}
            </span>
          </div>
          <div
            className="hidden sm:flex items-center gap-2"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '6px 14px',
              minWidth: 220,
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--muted)"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                color: 'var(--ink)',
                width: '100%',
              }}
            />
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 p-4 md:p-8"
          style={{ background: 'var(--bg)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
