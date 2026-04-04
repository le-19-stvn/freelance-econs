'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { Menu, X, Users, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { LegalFooter } from '@/components/ui/LegalFooter'

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
    label: 'Equipe',
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
    <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={36}
          height={36}
          className="rounded-full object-cover w-9 h-9 shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00A3FF] to-[#0057FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {name || 'Mon profil'}
        </div>
        <div className="text-[11px] text-gray-400 leading-tight">eCons Freelance</div>
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
        relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium
        transition-all duration-150 group
        ${active
          ? 'bg-[#00A3FF]/8 text-[#0057FF] font-semibold'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-[#00A3FF] to-[#0057FF] rounded-r-full" />
      )}
      <span className={active ? 'text-[#0057FF]' : 'text-gray-400 group-hover:text-gray-600'}>
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
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo_freelance.png"
            alt="Freelance Logo"
            width={38}
            height={38}
            className="shrink-0 rounded-xl"
            style={{ borderRadius: 10 }}
          />
          <div>
            <div className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Freelance
            </div>
            <div className="text-[10px] font-medium text-gray-400 tracking-widest uppercase leading-tight">
              by eCons
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-6 mb-2" />

      <nav className="flex-1 py-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="h-px bg-gray-100 mx-6 mt-2" />

      <div className="px-3 py-4">
        <SidebarAvatar />
      </div>
    </div>
  )
}

/* ── Main Layout ── */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications] = useState<{ id: string; message: string; date: string }[]>([])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const currentTitle = pageTitles[pathname] ?? 'eCons Freelance'

  return (
    <div className="flex min-h-dvh bg-[#F8FAFC]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 bg-white border-r border-gray-200">
        <SidebarContent pathname={pathname} isActive={isActive} />
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            className="relative flex flex-col w-72 h-full bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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

        {/* ── Topbar (ultra-minimal) ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0057FF] border-2 border-white" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        Aucune nouvelle notification
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {notifications.map((n) => (
                          <div key={n.id} className="px-4 py-3">
                            <div className="text-sm text-gray-800">{n.message}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{n.date}</div>
                          </div>
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
        <div className="border-t border-gray-200 bg-white">
          <LegalFooter />
        </div>
      </div>
    </div>
  )
}
