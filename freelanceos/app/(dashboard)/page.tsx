'use client'

import { useMemo, useState, useEffect } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { useProjects } from '@/hooks/useProjects'
import { createClient } from '@/lib/supabase/client'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ─────────────────────────────────────────
   eConique Design System
   Bold Swiss typography · Bento grid · Blue palette
   Navy: #00007c  |  Blue: #1f9eff  |  Cyan: #00b0df
   ───────────────────────────────────────── */

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-ink/5', text: 'text-ink2', label: 'Brouillon' },
  sent: { bg: 'bg-ec-blue/10', text: 'text-ec-navy', label: 'Envoyee' },
  paid: { bg: 'bg-ec-navy', text: 'text-white', label: 'Payee' },
  late: { bg: 'bg-danger/10', text: 'text-danger', label: 'En retard' },
}

function getLast6Months(): string[] {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }))
  }
  return months
}

export default function DashboardPage() {
  const [profileTvaRate, setProfileTvaRate] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('tva_rate')
        .eq('id', user.id)
        .single()
      if (data) setProfileTvaRate(data.tva_rate ?? 0)
    })()
  }, [])

  const { invoices, loading: loadingInv } = useInvoices()
  const { projects, loading: loadingProj } = useProjects()

  const safeInvoices = Array.isArray(invoices) ? invoices : []
  const safeProjects = Array.isArray(projects) ? projects : []

  const paidInvoices = safeInvoices.filter((i) => i.status === 'paid')
  const totalTTC = paidInvoices.reduce((sum, inv) => {
    const ht = calculateHT(inv.items ?? [])
    return sum + calculateTTC(ht, inv.tva_rate)
  }, 0)

  const pendingCount = safeInvoices.filter(
    (i) => i.status === 'draft' || i.status === 'sent'
  ).length

  const activeProjects = safeProjects.filter((p) => p.status === 'ongoing').length

  const tvaDisplay = profileTvaRate === 0
    ? 'N/A'
    : profileTvaRate !== null
      ? `${profileTvaRate}%`
      : '—'

  const tvaSubtext = profileTvaRate === 0 ? 'Non assujetti' : 'Taux TVA'

  // Smart Focus alerts
  const smartFocusAlerts = useMemo(() => {
    const alerts: {
      type: 'warning' | 'success' | 'info'
      icon: React.ReactNode
      text: string
      action: string
      href: string
    }[] = []

    safeInvoices
      .filter((inv) => inv.status === 'late')
      .slice(0, 2)
      .forEach((inv) => {
        const daysLate = inv.due_date
          ? Math.ceil((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        alerts.push({
          type: 'warning',
          icon: <AlertTriangle size={14} />,
          text: `Facture ${inv.invoice_number} en retard de ${daysLate}j`,
          action: 'Rappel',
          href: `/invoices/${inv.id}`,
        })
      })

    safeProjects
      .filter((p) => p.status === 'done' && !p.invoice_generated)
      .slice(0, 2)
      .forEach((p) => {
        alerts.push({
          type: 'success',
          icon: <CheckCircle2 size={14} />,
          text: `"${p.name}" termine`,
          action: 'Facturer',
          href: '/invoices/new',
        })
      })

    safeInvoices
      .filter((inv) => inv.status === 'draft')
      .slice(0, 1)
      .forEach((inv) => {
        alerts.push({
          type: 'info',
          icon: <Clock size={14} />,
          text: `${inv.invoice_number} en brouillon`,
          action: 'Finaliser',
          href: `/invoices/${inv.id}`,
        })
      })

    return alerts.slice(0, 3)
  }, [safeInvoices, safeProjects])

  // Revenue chart data
  const revenueData = useMemo(() => {
    const months = getLast6Months()
    const now = new Date()
    return months.map((label, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - idx) + 1, 1)
      const monthRevenue = paidInvoices
        .filter((inv) => {
          const d = new Date(inv.issue_date)
          return d >= monthDate && d < nextMonth
        })
        .reduce((sum, inv) => {
          const ht = calculateHT(inv.items ?? [])
          return sum + calculateTTC(ht, inv.tva_rate)
        }, 0)
      return { name: label, revenue: monthRevenue }
    })
  }, [paidInvoices])

  // URSSAF
  const urssafRate = 0.212
  const grossRevenue = totalTTC
  const urssafTax = grossRevenue * urssafRate
  const netIncome = grossRevenue - urssafTax

  const recentInvoices = safeInvoices.slice(0, 5)

  // Loading skeleton — eConique bento
  if (loadingInv || loadingProj) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`rounded-2xl border border-line bg-surface animate-pulse ${i === 1 ? 'col-span-2 row-span-2 p-8 md:p-10' : 'p-5 md:p-6'}`}
            >
              <div className="h-3 w-16 bg-line/60 rounded mb-4" />
              <div className={`${i === 1 ? 'h-16 w-48' : 'h-8 w-20'} bg-line/40 rounded`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const alertStyles = {
    warning: { dot: 'bg-danger', bg: 'bg-danger/5', border: 'border-danger/10' },
    success: { dot: 'bg-ec-blue', bg: 'bg-ec-blue/5', border: 'border-ec-blue/10' },
    info: { dot: 'bg-muted', bg: 'bg-muted/5', border: 'border-muted/10' },
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">

      {/* ═══════════════════════════════════════
          BENTO GRID — KPI CARDS
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

        {/* ── HERO: Chiffre d'affaires ── */}
        <div className="col-span-2 row-span-2 bg-ec-navy rounded-3xl p-7 md:p-10 relative overflow-hidden group">
          {/* Decorative grid lines */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          {/* Cyan glow */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-ec-cyan/20 blur-[80px]" />
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-ec-blue/15 blur-[60px]" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 md:mb-10">
              <span className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.25em]">
                Chiffre d&apos;affaires
              </span>
              <Link
                href="/invoices"
                className="flex items-center gap-1 text-[10px] md:text-[11px] font-semibold text-ec-cyan/70 hover:text-ec-cyan transition-colors uppercase tracking-wider"
              >
                Detail
                <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold text-white tracking-tighter leading-none mb-2">
              {formatCurrency(totalTTC)}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-1 w-8 rounded-full bg-ec-cyan" />
              <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
                {paidInvoices.length} facture{paidInvoices.length !== 1 ? 's' : ''} payee{paidInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Factures en attente ── */}
        <div className="bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6 relative overflow-hidden group hover:border-ec-blue/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-ec-blue to-ec-cyan opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] block mb-3">
            En attente
          </span>
          <div className="text-4xl md:text-5xl font-extrabold text-ink tracking-tighter leading-none">
            {pendingCount}
          </div>
          <span className="text-[10px] font-medium text-muted/60 uppercase tracking-wider mt-2 block">
            Factures
          </span>
        </div>

        {/* ── Projets actifs ── */}
        <div className="bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6 relative overflow-hidden group hover:border-ec-blue/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-ec-cyan to-ec-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] block mb-3">
            Projets actifs
          </span>
          <div className="text-4xl md:text-5xl font-extrabold text-ink tracking-tighter leading-none">
            {activeProjects}
          </div>
          <span className="text-[10px] font-medium text-muted/60 uppercase tracking-wider mt-2 block">
            En cours
          </span>
        </div>

        {/* ── TVA ── */}
        <div className="bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6 relative overflow-hidden group hover:border-ec-blue/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-ec-navy to-ec-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] block mb-3">
            {tvaSubtext}
          </span>
          <div className="text-4xl md:text-5xl font-extrabold text-ink tracking-tighter leading-none">
            {tvaDisplay}
          </div>
          <span className="text-[10px] font-medium text-muted/60 uppercase tracking-wider mt-2 block">
            TVA
          </span>
        </div>

        {/* ── Total factures ── */}
        <div className="bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6 relative overflow-hidden group hover:border-ec-blue/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-ec-blue to-ec-navy opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] block mb-3">
            Total
          </span>
          <div className="text-4xl md:text-5xl font-extrabold text-ink tracking-tighter leading-none">
            {safeInvoices.length}
          </div>
          <span className="text-[10px] font-medium text-muted/60 uppercase tracking-wider mt-2 block">
            Factures
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SMART FOCUS — Alerts strip
          ═══════════════════════════════════════ */}
      {smartFocusAlerts.length > 0 && (
        <div className="bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-ec-navy flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-ink tracking-tight leading-none">
                Smart Focus
              </h2>
              <span className="text-[9px] font-bold text-muted uppercase tracking-[0.25em]">
                Actions prioritaires
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {smartFocusAlerts.map((alert, idx) => {
              const styles = alertStyles[alert.type]
              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${styles.bg} border ${styles.border} rounded-xl px-4 py-3`}
                >
                  <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${styles.dot}`} />
                    {alert.text}
                  </div>
                  <Link
                    href={alert.href}
                    className="inline-flex items-center gap-1.5 bg-ec-navy text-white text-[11px] font-bold px-3.5 py-2 rounded-lg hover:bg-ec-navy/90 transition-colors whitespace-nowrap shrink-0 uppercase tracking-wider"
                  >
                    {alert.action}
                    <ArrowRight size={11} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          URSSAF SIMULATOR — Accent strip
          ═══════════════════════════════════════ */}
      <div className="bg-surface rounded-2xl md:rounded-3xl border border-line overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-ec-navy via-ec-blue to-ec-cyan" />
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">
              Simulateur URSSAF
            </span>
            <span className="text-[9px] font-bold text-ec-blue/50 uppercase tracking-[0.2em]">
              Auto-entrepreneur · 21.2%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-bg rounded-xl p-4">
              <div className="text-2xl md:text-3xl font-extrabold text-ink tracking-tighter leading-none mb-1">
                {formatCurrency(grossRevenue)}
              </div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                CA Brut
              </div>
            </div>
            <div className="bg-bg rounded-xl p-4">
              <div className="text-2xl md:text-3xl font-extrabold text-muted tracking-tighter leading-none mb-1">
                - {formatCurrency(urssafTax)}
              </div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                Cotisations
              </div>
            </div>
            <div className="bg-ec-navy/[0.03] border border-ec-navy/10 rounded-xl p-4">
              <div className="text-2xl md:text-3xl font-extrabold text-ec-navy tracking-tighter leading-none mb-1">
                {formatCurrency(netIncome)}
              </div>
              <div className="text-[10px] font-bold text-ec-navy/50 uppercase tracking-[0.2em]">
                Revenu Net
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          REVENUE CHART + RECENT INVOICES
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">

        {/* Revenue Chart — 3/5 */}
        <div className="lg:col-span-3 bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-extrabold text-ink tracking-tight leading-none">
                Revenus
              </h2>
              <span className="text-[9px] font-bold text-muted uppercase tracking-[0.25em]">
                6 derniers mois
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ec-blue" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Tendance
              </span>
            </div>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f9eff" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1f9eff" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E6ED" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 700 }}
                  axisLine={{ stroke: '#E4E6ED' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#00007c',
                    border: 'none',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,124,0.2)',
                    fontSize: 12,
                    color: '#fff',
                    fontWeight: 700,
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 10 }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1f9eff"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ r: 4, fill: '#00007c', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#1f9eff', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices — 2/5 */}
        <div className="lg:col-span-2 bg-surface rounded-2xl md:rounded-3xl border border-line p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-extrabold text-ink tracking-tight leading-none">
                Factures
              </h2>
              <span className="text-[9px] font-bold text-muted uppercase tracking-[0.25em]">
                Recentes
              </span>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-[10px] font-bold text-ec-blue hover:text-ec-navy transition-colors uppercase tracking-wider"
            >
              Tout
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col">
            {recentInvoices.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl font-extrabold text-line tracking-tighter mb-2">0</div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                  Aucune facture
                </div>
              </div>
            )}
            {recentInvoices.map((inv) => {
              const badge = statusBadge[inv.status] ?? statusBadge.draft
              const ht = calculateHT(inv.items ?? [])
              const ttc = calculateTTC(ht, inv.tva_rate)
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="group no-underline">
                  <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 -mx-1 hover:bg-bg transition-colors border-b border-line/50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink font-mono tracking-tight">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[10px] text-muted truncate">
                          {inv.client?.name ?? '---'}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-ink tracking-tight">
                      {formatCurrency(ttc)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
