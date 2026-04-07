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

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9.12 0A4 4 0 0016 8a4 4 0 00-4-4 4 4 0 00-4 4 4 4 0 000 8m0 0a4 4 0 013 3.87M15 8a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Factures',
    href: '/invoices',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Equipe',
    href: '/team',
    icon: <Users size={18} />,
  },
  {
    label: 'Profil',
    href: '/profile',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/projects': 'Projets',
  '/invoices': 'Factures',
  '/team': 'Equipe',
  '/profile': 'Profil',
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
    <Link href="/profile" className="flex items-center gap-3 p-3 border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors duration-100 group">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={36}
          height={36}
          className="object-cover w-9 h-9 shrink-0 border-2 border-zinc-950"
          unoptimized
        />
      ) : (
        <div className="w-9 h-9 bg-zinc-950 flex items-center justify-center text-white text-sm font-black shrink-0">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold truncate leading-tight uppercase tracking-tight">
          {name || 'Mon profil'}
        </div>
        <div className="text-[10px] font-bold tracking-widest uppercase leading-tight opacity-50">
          eCons Freelance
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
        relative flex items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase tracking-wide
        transition-colors duration-100 border-b-2 border-zinc-200
        ${active
          ? 'bg-zinc-950 text-white border-zinc-950'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
        }
      `}
    >
      <span className={active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-950'}>
        {item.icon}
      </span>
      {item.label}
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
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo_freelance.png"
            alt="Freelance Logo"
            width={38}
            height={38}
            className="shrink-0 border-2 border-zinc-950"
          />
          <div>
            <div className="text-[17px] font-black text-zinc-950 tracking-tighter leading-none uppercase">
              Freelance
            </div>
            <div className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase leading-tight mt-0.5">
              by eCons
            </div>
          </div>
        </div>
      </div>

      <div className="h-[2px] bg-zinc-950 mx-0" />

      <nav className="flex-1 flex flex-col overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="h-[2px] bg-zinc-950 mx-0" />

      <div className="p-3">
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
    <div className="px-4 py-3 border-b-2 border-zinc-200 last:border-b-0">
      <div className="text-sm text-zinc-900 leading-snug font-medium">{notif.message}</div>
      <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">{timeAgo}</div>

      {isInvite ? (
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={async () => { setActing(true); await onAccept(notif) }}
            disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-zinc-950 border-2 border-zinc-950 hover:bg-white hover:text-zinc-950 transition-colors duration-100 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            <Check size={12} />
            Accepter
          </button>
          <button
            onClick={async () => { setActing(true); await onDecline(notif) }}
            disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 bg-white border-2 border-zinc-300 hover:border-zinc-950 hover:text-zinc-950 transition-colors duration-100 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            <XCircle size={12} />
            Refuser
          </button>
        </div>
      ) : (
        <button
          onClick={() => onDismiss(notif.id)}
          className="mt-1.5 text-[10px] text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer uppercase tracking-wider font-bold border-b border-zinc-300 hover:border-zinc-950"
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

  const currentTitle = pageTitles[pathname] ?? 'eCons Freelance'

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
    <div className="flex min-h-dvh bg-[#f4f4f0]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 bg-white border-r-[3px] border-zinc-950">
        <SidebarContent pathname={pathname} isActive={isActive} />
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="relative flex flex-col w-72 h-full bg-white border-r-[3px] border-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-950 hover:bg-zinc-950 hover:text-white border-2 border-zinc-950 transition-colors duration-100"
              aria-label="Fermer le menu"
            >
              <X size={18} />
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
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b-[3px] border-zinc-950">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-zinc-950 border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors duration-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tighter leading-none uppercase">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-zinc-950 border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white transition-colors duration-100"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border-2 border-zinc-950 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-zinc-950 flex items-center justify-between bg-zinc-950 text-white">
                      <span className="text-xs font-black uppercase tracking-wider">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white text-zinc-950 px-2 py-0.5">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={24} className="mx-auto text-zinc-300 mb-2" />
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
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
        <div className="border-t-[3px] border-zinc-950 bg-white">
          <LegalFooter />
        </div>
      </div>
    </div>
  )
}
