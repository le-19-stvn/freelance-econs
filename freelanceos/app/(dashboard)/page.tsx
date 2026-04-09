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
   eConic Phase 2 — Virgil Abloh × Swiss Industrial
   Cobalt: #0052FF  |  Ink: #18181B  |  Line: zinc-200
   ═══════════════════════════════════════════════ */

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-transparent border-[#d9d9d9]', text: 'text-[#080808] font-mono', label: 'BROUILLON' },
  sent: { bg: 'bg-transparent border-[#d9d9d9]', text: 'text-[#080808] font-mono', label: 'ENVOYÉE' },
  paid: { bg: 'bg-transparent border-[#d9d9d9]', text: 'text-[#080808] font-mono', label: 'PAYÉE' },
  late: { bg: 'bg-transparent border-[#d9d9d9]', text: 'text-[#080808] font-mono', label: 'EN RETARD' },
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

  // ── Loading skeleton — eConic industrial ──
  if (loadingInv || loadingProj) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`border border-zinc-200 bg-white animate-pulse ${i === 1 ? 'col-span-2 row-span-2 p-8 md:p-10' : 'p-5 md:p-6'}`}
            >
              <div className="h-2 w-16 bg-zinc-200 mb-4" />
              <div className={`${i === 1 ? 'h-16 w-48' : 'h-8 w-20'} bg-zinc-100`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const alertStyles = {
    warning: { dot: 'bg-[#FF5C00]', border: 'border-[#FF5C0030]' },
    success: { dot: 'bg-[#0052FF]', border: 'border-[#0052FF30]' },
    info: { dot: 'bg-zinc-400', border: 'border-zinc-200' },
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">

      {/* ═══════════════════════════════════════
          KPI GRID — Industrial Blueprint
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

        {/* ── HERO: Chiffre d'affaires ── */}
        <div className="col-span-2 row-span-2 bg-zinc-900 p-7 md:p-10 relative overflow-hidden group">
          {/* Blueprint grid overlay */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 md:mb-10">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                &quot;CHIFFRE_AFFAIRES&quot;
              </span>
              <Link
                href="/invoices"
                className="flex items-center gap-1 text-[9px] font-black text-[#0052FF] hover:text-white transition-colors uppercase tracking-[0.15em]"
              >
                Détail
                <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-black text-white tracking-tighter leading-none mb-2 font-mono">
              {formatCurrency(totalTTC)}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-px w-8 bg-[#0052FF]" />
              <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">
                {paidInvoices.length} facture{paidInvoices.length !== 1 ? 's' : ''} payée{paidInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Factures en attente ── */}
        <div className="bg-white border border-zinc-200 p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 label-abloh">KPI_PENDING</span>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] block mb-3">
            &quot;EN_ATTENTE&quot;
          </span>
          <div className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none">
            {pendingCount}
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] mt-2 block">
            Factures
          </span>
        </div>

        {/* ── Projets actifs ── */}
        <div className="bg-white border border-zinc-200 p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 label-abloh">KPI_ACTIVE</span>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] block mb-3">
            &quot;PROJETS_ACTIFS&quot;
          </span>
          <div className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none">
            {activeProjects}
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] mt-2 block">
            En cours
          </span>
        </div>

        {/* ── TVA ── */}
        <div className="bg-white border border-zinc-200 p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 label-abloh">TAX_RATE</span>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] block mb-3">
            &quot;{tvaSubtext.toUpperCase().replace(/ /g, '_')}&quot;
          </span>
          <div className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none font-mono">
            {tvaDisplay}
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] mt-2 block">
            TVA
          </span>
        </div>

        {/* ── Total factures ── */}
        <div className="bg-white border border-zinc-200 p-5 md:p-6 relative group">
          <span className="absolute top-2 right-2.5 label-abloh">UNIT_TOTAL</span>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] block mb-3">
            &quot;TOTAL_FACTURES&quot;
          </span>
          <div className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none">
            {safeInvoices.length}
          </div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] mt-2 block">
            Factures
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          "SMART_FOCUS" — Industrial Alert Strip
          ═══════════════════════════════════════ */}
      <div className="bg-white border border-zinc-200 p-5 md:p-6 relative">
        <span className="absolute top-2 right-2.5 label-abloh">REF_FOCUS_001</span>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 bg-zinc-900 flex items-center justify-center">
            <TrendingUp size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-zinc-900 tracking-tight leading-none uppercase">
              &quot;SMART_FOCUS&quot;
            </h2>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              Actions prioritaires
            </span>
          </div>
        </div>

        {smartFocusAlerts.length === 0 ? (
          <div className="border border-zinc-200 px-4 py-6 text-center">
            <CheckCircle2 size={18} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
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
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${styles.border} px-4 py-3`}
                >
                  <div className="flex items-center gap-3 text-[12px] font-bold text-zinc-900">
                    <span className={`shrink-0 w-2 h-2 ${styles.dot}`} />
                    {alert.text}
                  </div>
                  <Link
                    href={alert.href}
                    className="inline-flex items-center gap-1.5 bg-[#0052FF] text-white text-[10px] font-black px-3.5 py-2 hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0 uppercase tracking-[0.1em]"
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
          URSSAF SIMULATOR — Industrial Strip
          ═══════════════════════════════════════ */}
      <div className="bg-white border border-zinc-200 overflow-hidden relative">
        <span className="absolute top-2 right-2.5 label-abloh z-10">SIM_URSSAF</span>
        <div className="h-px bg-[#0052FF]" />
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">
              &quot;SIMULATEUR_URSSAF&quot;
            </span>
            <span className="text-[9px] font-bold text-[#0052FF]/50 uppercase tracking-[0.12em]">
              Auto-entrepreneur · 21.2%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-zinc-200 p-4">
              <div className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tighter leading-none mb-1 font-mono">
                {formatCurrency(grossRevenue)}
              </div>
              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                CA Brut
              </div>
            </div>
            <div className="border border-zinc-200 p-4">
              <div className="text-2xl md:text-3xl font-black text-zinc-400 tracking-tighter leading-none mb-1 font-mono">
                - {formatCurrency(urssafTax)}
              </div>
              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                Cotisations
              </div>
            </div>
            <div className="border border-[#0052FF30] bg-[#0052FF08] p-4">
              <div className="text-2xl md:text-3xl font-black text-[#0052FF] tracking-tighter leading-none mb-1 font-mono">
                {formatCurrency(netIncome)}
              </div>
              <div className="text-[9px] font-black text-[#0052FF]/50 uppercase tracking-[0.15em]">
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
        <div className="lg:col-span-3 bg-white border border-zinc-200 p-5 md:p-6 relative">
          <span className="absolute top-2 right-2.5 label-abloh">CHART_REV</span>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[13px] font-black text-zinc-900 tracking-tight leading-none uppercase">
                &quot;REVENUS&quot;
              </h2>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                6 derniers mois
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#0052FF]" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em]">
                Tendance
              </span>
            </div>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0052FF" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0052FF" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#71717A', fontWeight: 700 }}
                  axisLine={{ stroke: '#E4E4E7' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#71717A', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181B',
                    border: '1px solid #27272A',
                    borderRadius: 0,
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: 700,
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 9 }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0052FF"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={{ r: 3, fill: '#18181B', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#0052FF', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices — 2/5 */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-5 md:p-6 relative">
          <span className="absolute top-2 right-2.5 label-abloh">REF_INV_LIST</span>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[13px] font-black text-zinc-900 tracking-tight leading-none uppercase">
                &quot;FACTURES&quot;
              </h2>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Récentes
              </span>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-[9px] font-black text-[#0052FF] hover:text-zinc-900 transition-colors uppercase tracking-[0.12em]"
            >
              Tout
              <ArrowUpRight size={11} />
            </Link>
          </div>

          <div className="flex flex-col">
            {recentInvoices.length === 0 && (
              <div className="text-center py-10 border border-zinc-200">
                <div className="text-4xl font-black text-zinc-200 tracking-tighter mb-2">0</div>
                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">
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
                  <div className="flex items-center justify-between gap-3 px-3 py-3 -mx-1 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-zinc-900 tracking-tight font-mono">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {inv.client?.name ?? '---'}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-black text-zinc-900 tracking-tight font-mono">
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
