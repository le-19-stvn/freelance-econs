'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { Menu, X, Users, Bell, Check, XCircle, Settings } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useNotifications } from '@/hooks/useNotifications'
import { LegalFooter } from '@/components/ui/LegalFooter'
import type { Notification } from '@/types'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9.12 0A4 4 0 0016 8a4 4 0 00-4-4 4 4 0 00-4 4 4 4 0 000 8m0 0a4 4 0 013 3.87M15 8a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Factures',
    href: '/invoices',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Equipe',
    href: '/team',
    icon: <Users size={16} />,
  },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projets',
  '/invoices': 'Factures',
  '/team': 'Equipe',
  '/profile': 'Mon compte',
}

/* ── Header Profile ── */
function HeaderProfile() {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initial, setInitial] = useState('F')
  const [name, setName] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const userId = await getAuthUserId(supabase)
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, plan_type, plan_status')
          .eq('id', userId)
          .single()
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        if (data?.full_name) {
          setInitial(data.full_name[0].toUpperCase())
          setName(data.full_name)
        }
        // Tag every Sentry event with user identity + plan so we know
        // which customer hit the error and whether they're paying.
        Sentry.setUser({
          id: userId,
          email: user?.email,
        })
        Sentry.setTag('plan_type', data?.plan_type ?? 'free')
        Sentry.setTag('plan_status', data?.plan_status ?? 'inactive')
      } catch {}
    })()
  }, [supabase])

  return (
    <Link href="/profile" className="flex items-center gap-2.5 pl-3 border-l border-zinc-100 hover:opacity-80 transition-opacity">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={28}
          height={28}
          className="object-cover w-7 h-7 rounded-full shrink-0 border border-zinc-100"
          unoptimized
        />
      ) : (
        <div className="w-7 h-7 bg-blue-700 rounded-full flex items-center justify-center text-white text-[11px] font-medium shrink-0">
          {initial}
        </div>
      )}
      <div className="min-w-0 hidden sm:block">
        <div className="text-sm font-medium text-zinc-900 truncate leading-tight">
          {name || 'Mon profil'}
        </div>
      </div>
    </Link>
  )
}

/* ── Nav Item ── */
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
        flex items-center gap-3 mx-3 px-4 py-2.5
        text-sm font-medium
        transition-all duration-150 rounded-xl
        ${active
          ? 'bg-blue-700 text-white'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }
      `}
    >
      <span className={active ? 'opacity-100' : 'opacity-60'}>{item.icon}</span>
      <span>{item.label}</span>
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
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo_freelance.png"
            alt="Freelance Logo"
            width={34}
            height={34}
            className="shrink-0 rounded-xl border border-zinc-100"
          />
          <div>
            <div className="text-[15px] font-semibold text-zinc-900 leading-tight">
              Freelance
            </div>
            <div className="text-xs text-zinc-500 leading-tight">
              by eCons
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-100 mx-5" />

      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto">
        <div className="h-px bg-zinc-100 mx-5" />
        <div className="px-3 py-3">
          <Link
            href="/profile"
            onClick={onNavigate}
            className={`
              flex items-center gap-3 px-4 py-2.5
              text-sm font-medium
              transition-all duration-150 rounded-xl
              ${isActive('/profile')
                ? 'bg-blue-700 text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }
            `}
          >
            <Settings size={14} />
            <span>Mon compte</span>
          </Link>
        </div>
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
      <div className="text-sm font-medium text-zinc-900 leading-snug">{notif.message}</div>
      <div className="text-xs text-zinc-400 mt-1">{timeAgo}</div>

      {isInvite ? (
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={async () => { setActing(true); await onAccept(notif) }}
            disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check size={12} />
            Accepter
          </button>
          <button
            onClick={async () => { setActing(true); await onDecline(notif) }}
            disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XCircle size={12} />
            Refuser
          </button>
        </div>
      ) : (
        <button
          onClick={() => onDismiss(notif.id)}
          className="mt-1.5 text-xs text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer font-medium"
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

/* ── Main Layout ── */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, fetchNotifications, markAsRead, acceptTeamInvite, declineTeamInvite } = useNotifications()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const currentTitle = pageTitles[pathname] ?? 'Freelance'

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
    <div className="flex min-h-dvh bg-zinc-50">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-white shadow-elevated">
        <SidebarContent pathname={pathname} isActive={isActive} />
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="relative flex flex-col w-[260px] h-full bg-white shadow-elevated-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
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

        {/* ── Topbar — glass effect ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-xl text-zinc-900 hover:bg-zinc-100 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-sm font-semibold text-zinc-900">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-700" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated-lg border border-zinc-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="text-xs font-medium text-white bg-blue-700 rounded-full px-2 py-0.5">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={20} className="mx-auto text-zinc-300 mb-2" />
                        <p className="text-sm text-zinc-400">Aucune notification</p>
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

            {/* Profile */}
            <HeaderProfile />
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

        {/* ── Legal Footer ── */}
        <div className="border-t border-zinc-100 bg-white">
          <LegalFooter />
        </div>
      </div>
    </div>
  )
}
