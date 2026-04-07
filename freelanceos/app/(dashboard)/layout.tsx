'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { Menu, X, Users, Bell, Check, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useNotifications } from '@/hooks/useNotifications'
import { LegalFooter } from '@/components/ui/LegalFooter'
import type { Notification } from '@/types'

/* ═══════════════════════════════════════════════
   eConic Phase 2 — Virgil Abloh × Swiss Industrial
   Dashboard Layout
   ═══════════════════════════════════════════════ */

const navItems = [
  {
    label: 'DASHBOARD',
    href: '/',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    label: 'CLIENTS',
    href: '/clients',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9.12 0A4 4 0 0016 8a4 4 0 00-4-4 4 4 0 00-4 4 4 4 0 000 8m0 0a4 4 0 013 3.87M15 8a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'PROJETS',
    href: '/projects',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    label: 'FACTURES',
    href: '/invoices',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'EQUIPE',
    href: '/team',
    icon: <Users size={16} />,
  },
  {
    label: 'PROFIL',
    href: '/profile',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const pageTitles: Record<string, string> = {
  '/': 'DASHBOARD',
  '/clients': 'CLIENTS',
  '/projects': 'PROJETS',
  '/invoices': 'FACTURES',
  '/team': 'EQUIPE',
  '/profile': 'PROFIL',
}

/* ── Sidebar Avatar ── */
function SidebarAvatar() {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initial, setInitial] = useState('F')
  const [name, setName] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const userId = await getAuthUserId(supabase)
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', userId)
          .single()
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        if (data?.full_name) {
          setInitial(data.full_name[0].toUpperCase())
          setName(data.full_name)
        }
      } catch {}
    })()
  }, [supabase])

  return (
    <Link href="/profile" className="flex items-center gap-3 p-3 border border-transparent hover:border-zinc-200 transition-colors group">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={32}
          height={32}
          className="object-cover w-8 h-8 shrink-0 border border-zinc-200"
          unoptimized
        />
      ) : (
        <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center text-white text-[11px] font-black shrink-0">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-black text-zinc-900 truncate leading-tight uppercase tracking-wide">
          {name || 'Mon profil'}
        </div>
        <div className="text-[9px] font-bold text-zinc-400 leading-tight tracking-[0.15em] uppercase">eCons Freelance</div>
      </div>
    </Link>
  )
}

/* ── Nav Item — Abloh Style ── */
function NavItem({
  item,
  active,
  onClick,
}: {
  item: typeof navItems[0]
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-4 py-2.5
        text-[12px] font-black tracking-[0.06em]
        transition-all duration-100
        ${active
          ? 'bg-[#0052FF] text-white'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
        }
      `}
    >
      <span className={active ? 'text-white/80' : 'text-zinc-400'}>
        {item.icon}
      </span>
      <span>&quot;{item.label}&quot;</span>
    </Link>
  )
}

/* ── Sidebar Content ── */
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
    <div className="flex flex-col h-full">
      {/* Logo + System Label */}
      <div className="px-5 pt-5 pb-4">
        <span className="label-abloh block mb-2.5">SYSTEM_NAV</span>
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo_freelance.png"
            alt="Freelance Logo"
            width={34}
            height={34}
            className="shrink-0 border border-zinc-200"
          />
          <div>
            <div className="text-[15px] font-black text-zinc-900 tracking-tight leading-tight uppercase">
              Freelance
            </div>
            <div className="text-[9px] font-bold text-zinc-400 tracking-[0.2em] uppercase leading-tight">
              by eCons
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-200 mx-5" />

      <nav className="flex-1 py-3 flex flex-col gap-px overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="h-px bg-zinc-200 mx-5" />

      <div className="px-2 py-3">
        <SidebarAvatar />
      </div>
    </div>
  )
}

/* ── Notification Item ── */
function NotificationItem({
  notif,
  onAccept,
  onDecline,
  onDismiss,
}: {
  notif: Notification
  onAccept: (n: Notification) => void
  onDecline: (n: Notification) => void
  onDismiss: (id: string) => void
}) {
  const [acting, setActing] = useState(false)
  const isInvite = notif.type === 'TEAM_INVITE'
  const timeAgo = getTimeAgo(notif.created_at)

  return (
    <div className="px-4 py-3">
      <div className="text-[12px] font-medium text-zinc-800 leading-snug">{notif.message}</div>
      <div className="text-[10px] text-zinc-400 mt-1 font-mono">{timeAgo}</div>

      {isInvite ? (
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={async () => { setActing(true); await onAccept(notif) }}
            disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white bg-zinc-900 hover:bg-[#0052FF] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check size={11} />
            Accepter
          </button>
          <button
            onClick={async () => { setActing(true); await onDecline(notif) }}
            disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-500 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XCircle size={11} />
            Refuser
          </button>
        </div>
      ) : (
        <button
          onClick={() => onDismiss(notif.id)}
          className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer uppercase tracking-wide font-bold"
        >
          Marquer comme lu
        </button>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "A l'instant"
  if (mins < 60) return `Il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

/* ═══════════════════════════════════════════════
   Main Layout — Industrial Blueprint Grid
   ═══════════════════════════════════════════════ */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, fetchNotifications, markAsRead, acceptTeamInvite, declineTeamInvite } = useNotifications()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const currentTitle = pageTitles[pathname] ?? 'eCONS FREELANCE'

  const handleAccept = async (n: Notification) => {
    await acceptTeamInvite(n)
    await fetchNotifications()
  }

  const handleDecline = async (n: Notification) => {
    await declineTeamInvite(n)
    await fetchNotifications()
  }

  const handleDismiss = async (id: string) => {
    await markAsRead(id)
  }

  return (
    <div className="flex min-h-dvh bg-[#F8F8F8]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-white border-r border-zinc-200">
        <SidebarContent pathname={pathname} isActive={isActive} />
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="relative flex flex-col w-[260px] h-full bg-white border-r border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
            <SidebarContent
              pathname={pathname}
              isActive={isActive}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 md:px-6 bg-white border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 text-zinc-500 hover:bg-zinc-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-3">
              <span className="label-abloh hidden sm:inline">HEADER_BAR</span>
              <div className="w-px h-4 bg-zinc-200 hidden sm:block" />
              <h1 className="text-[13px] font-black text-zinc-900 tracking-[0.06em] uppercase">
                &quot;{currentTitle}&quot;
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-zinc-500 hover:bg-zinc-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#0052FF]" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute top-full right-0 mt-1 w-80 sm:w-96 bg-white border border-zinc-200 z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-[11px] font-black text-zinc-900 uppercase tracking-wide">&quot;NOTIFICATIONS&quot;</span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] font-black text-[#0052FF] bg-[#0052FF14] px-2 py-0.5">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={20} className="mx-auto text-zinc-300 mb-2" />
                        <p className="text-[11px] text-zinc-400 uppercase tracking-wide font-bold">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                        {notifications.map((n) => (
                          <NotificationItem
                            key={n.id}
                            notif={n}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                            onDismiss={handleDismiss}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

        {/* ── Legal Footer ── */}
        <div className="border-t border-zinc-200 bg-white">
          <LegalFooter />
        </div>
      </div>
    </div>
  )
}
