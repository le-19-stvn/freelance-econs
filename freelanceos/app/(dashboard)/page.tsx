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

/* ═══════════════════════════════════════════════
   Null Studio® — Monochrome Design System
   #ffffff bg | #0a0a0a text | #f5f5f5 secondary
   ═══════════════════════════════════════════════ */

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-[#f5f5f5]', text: 'text-[#0a0a0a]', label: 'Brouillon' },
  sent: { bg: 'bg-[#f5f5f5]', text: 'text-[#0a0a0a]', label: 'Envoyée' },
  paid: { bg: 'bg-[#f5f5f5]', text: 'text-[#0a0a0a]', label: 'Payée' },
  late: { bg: 'bg-[#f5f5f5]', text: 'text-[#0a0a0a]', label: 'En retard' },
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

  // ── Smart Focus alerts ──
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
          icon: <AlertTriangle size={13} />,
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
          icon: <CheckCircle2 size={13} />,
          text: `"${p.name}" terminé — facturer`,
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
          icon: <Clock size={13} />,
          text: `${inv.invoice_number} en brouillon`,
          action: 'Finaliser',
          href: `/invoices/${inv.id}`,
        })
      })

    return alerts.slice(0, 3)
  }, [safeInvoices, safeProjects])

  // ── Revenue chart data ──
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

  // ── URSSAF ──
  const urssafRate = 0.212
  const grossRevenue = totalTTC
  const urssafTax = grossRevenue * urssafRate
  const netIncome = grossRevenue - urssafTax

  const recentInvoices = safeInvoices.slice(0, 5)

  // ── Loading skeleton — Null Studio ──
  if (loadingInv || loadingProj) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`bg-white rounded-[18px] shadow-md animate-pulse ${i === 1 ? 'col-span-2 row-span-2 p-8 md:p-10' : 'p-5 md:p-6'}`}
            >
              <div className="h-2 w-16 bg-[#e7e7e7] rounded-full mb-4" />
              <div className={`${i === 1 ? 'h-16 w-48' : 'h-8 w-20'} bg-[#f5f5f5] rounded-[10px]`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const alertStyles = {
    warning: { dot: 'bg-[#0a0a0a]', border: 'border-[#e7e7e7]' },
    success: { dot: 'bg-[#0a0a0a]', border: 'border-[#e7e7e7]' },
    info: { dot: 'bg-[#e7e7e7]', border: 'border-[#e7e7e7]' },
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">

      {/* ═══════════════════════════════════════
          KPI GRID — Null Studio
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

        {/* ── HERO: Chiffre d'affaires ── */}
        <div className="col-span-2 row-span-2 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] rounded-[18px] p-7 md:p-10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 md:mb-10">
              <span className="text-[12px] font-semibold text-white/40 tracking-[-0.04em]">
                (Revenue)
              </span>
              <Link
                href="/invoices"
                className="flex items-center gap-1 text-[12px] font-semibold text-white/60 hover:text-white transition-colors tracking-[-0.04em]"
              >
                Détail
                <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-black text-white tracking-[-0.06em] leading-none mb-2">
              {formatCurrency(totalTTC)}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-px w-8 bg-white/20" />
              <span className="text-[12px] font-semibold text-white/40 tracking-[-0.04em]">
                {paidInvoices.length} facture{paidInvoices.length !== 1 ? 's' : ''} payée{paidInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Factures en attente ── */}
        <div className="bg-white rounded-[18px] shadow-md p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(001)</span>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] block mb-3">
            (En attente)
          </span>
          <div className="text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
            {pendingCount}
          </div>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] mt-2 block">
            Factures
          </span>
        </div>

        {/* ── Projets actifs ── */}
        <div className="bg-white rounded-[18px] shadow-md p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(002)</span>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] block mb-3">
            (Projets actifs)
          </span>
          <div className="text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
            {activeProjects}
          </div>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] mt-2 block">
            En cours
          </span>
        </div>

        {/* ── TVA ── */}
        <div className="bg-white rounded-[18px] shadow-md p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(003)</span>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] block mb-3">
            ({tvaSubtext})
          </span>
          <div className="text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
            {tvaDisplay}
          </div>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] mt-2 block">
            TVA
          </span>
        </div>

        {/* ── Total factures ── */}
        <div className="bg-white rounded-[18px] shadow-md p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(004)</span>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] block mb-3">
            (Total factures)
          </span>
          <div className="text-4xl md:text-5xl font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
            {safeInvoices.length}
          </div>
          <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] mt-2 block">
            Factures
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Smart Focus — Null Studio
          ═══════════════════════════════════════ */}
      <div className="bg-white rounded-[18px] shadow-md p-5 md:p-6 relative">
        <span className="absolute top-3 right-3 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(005)</span>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-[#0a0a0a] rounded-full flex items-center justify-center">
            <TrendingUp size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
              Smart Focus
            </h2>
            <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
              Actions prioritaires
            </span>
          </div>
        </div>

        {smartFocusAlerts.length === 0 ? (
          <div className="rounded-[10px] bg-[#f5f5f5] px-4 py-6 text-center">
            <CheckCircle2 size={18} className="mx-auto text-[#0a0a0a]/20 mb-2" />
            <p className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
              Aucune action requise
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {smartFocusAlerts.map((alert, idx) => {
              const styles = alertStyles[alert.type]
              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${styles.border} rounded-[10px] px-4 py-3`}
                >
                  <div className="flex items-center gap-3 text-[12px] font-semibold text-[#0a0a0a] tracking-[-0.04em]">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${styles.dot}`} />
                    {alert.text}
                  </div>
                  <Link
                    href={alert.href}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-[11px] font-semibold px-4 py-2 rounded-full hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all whitespace-nowrap shrink-0 tracking-[-0.04em]"
                  >
                    {alert.action}
                    <ArrowRight size={10} />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          URSSAF Simulator — Null Studio
          ═══════════════════════════════════════ */}
      <div className="bg-white rounded-[18px] shadow-md overflow-hidden relative">
        <span className="absolute top-3 right-3 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em] z-10">(006)</span>
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
              (Simulateur URSSAF)
            </span>
            <span className="text-[12px] font-semibold text-[#0a0a0a]/30 tracking-[-0.04em]">
              Auto-entrepreneur · 21.2%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-[10px] bg-[#f5f5f5] p-4">
              <div className="text-2xl md:text-3xl font-black text-[#0a0a0a] tracking-[-0.06em] leading-none mb-1">
                {formatCurrency(grossRevenue)}
              </div>
              <div className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
                CA Brut
              </div>
            </div>
            <div className="rounded-[10px] bg-[#f5f5f5] p-4">
              <div className="text-2xl md:text-3xl font-black text-[#0a0a0a]/50 tracking-[-0.06em] leading-none mb-1">
                - {formatCurrency(urssafTax)}
              </div>
              <div className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
                Cotisations
              </div>
            </div>
            <div className="rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] p-4">
              <div className="text-2xl md:text-3xl font-black text-white tracking-[-0.06em] leading-none mb-1">
                {formatCurrency(netIncome)}
              </div>
              <div className="text-[12px] font-semibold text-white/70 tracking-[-0.04em]">
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
        <div className="lg:col-span-3 bg-white rounded-[18px] shadow-md p-5 md:p-6 relative">
          <span className="absolute top-3 right-3 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(007)</span>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[13px] font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
                Revenus
              </h2>
              <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
                6 derniers mois
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
                Tendance
              </span>
            </div>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e7e7" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.4)', fontWeight: 600 }}
                  axisLine={{ stroke: '#e7e7e7' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.4)', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v + '\u00a0\u20ac'}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0a0a0a',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 10 }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={{ r: 3, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-[18px] shadow-md p-5 md:p-6 relative">
          <span className="absolute top-3 right-3 text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">(008)</span>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[13px] font-black text-[#0a0a0a] tracking-[-0.06em] leading-none">
                Factures
              </h2>
              <span className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
                Récentes
              </span>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-[12px] font-semibold text-[#0a0a0a] hover:text-[#0a0a0a]/60 transition-colors tracking-[-0.04em]"
            >
              Tout
              <ArrowUpRight size={11} />
            </Link>
          </div>

          <div className="flex flex-col">
            {recentInvoices.length === 0 && (
              <div className="text-center py-10 rounded-[10px] bg-[#f5f5f5]">
                <div className="text-4xl font-black text-[#0a0a0a]/10 tracking-[-0.06em] mb-2">0</div>
                <div className="text-[12px] font-semibold text-[#0a0a0a]/40 tracking-[-0.04em]">
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
                  <div className="flex items-center justify-between gap-3 px-3 py-3 -mx-1 hover:bg-[#f5f5f5] transition-colors rounded-[10px] border-b border-[#e7e7e7] last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-[-0.04em] rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#0a0a0a] tracking-[-0.04em]">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[10px] text-[#0a0a0a]/40 truncate">
                          {inv.client?.name ?? '---'}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-black text-[#0a0a0a] tracking-[-0.06em]">
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
