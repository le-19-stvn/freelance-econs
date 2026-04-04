'use client'

import { useMemo } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { useProjects } from '@/hooks/useProjects'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileText,
  FolderOpen,
  Briefcase,
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
   Design tokens (Swiss / eCons Blue)
   bg: #F8FAFC  |  card: #FFFFFF  |  border: #E5E7EB
   gradient: from-[#00A3FF] to-[#0057FF]
   card radius: rounded-2xl (16px)
   shadow: shadow-sm = 0 1px 3px rgba(0,0,0,0.05)
   ───────────────────────────────────────── */

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Brouillon' },
  sent: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Envoyee' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Payee' },
  late: { bg: 'bg-red-50', text: 'text-red-700', label: 'En retard' },
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
  const { invoices, loading: loadingInv } = useInvoices()
  const { projects, loading: loadingProj } = useProjects()

  const paidInvoices = invoices.filter((i) => i.status === 'paid')
  const totalTTC = paidInvoices.reduce((sum, inv) => {
    const ht = calculateHT(inv.items ?? [])
    return sum + calculateTTC(ht, inv.tva_rate)
  }, 0)

  const pendingCount = invoices.filter(
    (i) => i.status === 'draft' || i.status === 'sent'
  ).length

  const activeProjects = projects.filter((p) => p.status === 'ongoing').length

  const avgTVA =
    invoices.length > 0
      ? invoices.reduce((sum, i) => sum + i.tva_rate, 0) / invoices.length
      : 0

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(totalTTC),
      icon: <DollarSign size={20} />,
      accent: 'from-[#00A3FF] to-[#0057FF]',
    },
    {
      label: 'Factures en attente',
      value: String(pendingCount),
      icon: <FileText size={20} />,
      accent: 'from-amber-400 to-amber-600',
    },
    {
      label: 'Projets actifs',
      value: String(activeProjects),
      icon: <FolderOpen size={20} />,
      accent: 'from-emerald-400 to-emerald-600',
    },
    {
      label: 'Taux TVA moyen',
      value: `${avgTVA.toFixed(1)}%`,
      icon: <Briefcase size={20} />,
      accent: 'from-violet-400 to-violet-600',
    },
  ]

  // Smart Focus alerts
  const smartFocusAlerts = useMemo(() => {
    const alerts: {
      type: 'warning' | 'success' | 'info'
      icon: React.ReactNode
      text: string
      action: string
      href: string
    }[] = []

    invoices
      .filter((inv) => inv.status === 'late')
      .slice(0, 2)
      .forEach((inv) => {
        const daysLate = inv.due_date
          ? Math.ceil((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        alerts.push({
          type: 'warning',
          icon: <AlertTriangle size={16} />,
          text: `Facture ${inv.invoice_number} en retard de ${daysLate} jour(s)`,
          action: 'Envoyer un rappel',
          href: `/invoices/${inv.id}`,
        })
      })

    projects
      .filter((p) => p.status === 'done' && !p.invoice_generated)
      .slice(0, 2)
      .forEach((p) => {
        alerts.push({
          type: 'success',
          icon: <CheckCircle2 size={16} />,
          text: `Projet "${p.name}" termine`,
          action: 'Generer la facture',
          href: '/invoices/new',
        })
      })

    invoices
      .filter((inv) => inv.status === 'draft')
      .slice(0, 1)
      .forEach((inv) => {
        alerts.push({
          type: 'info',
          icon: <Clock size={16} />,
          text: `Facture ${inv.invoice_number} en brouillon`,
          action: 'Finaliser',
          href: `/invoices/${inv.id}`,
        })
      })

    return alerts.slice(0, 3)
  }, [invoices, projects])

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

  const recentInvoices = invoices.slice(0, 5)

  // Loading skeleton
  if (loadingInv || loadingProj) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-28 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const alertStyles = {
    warning: { iconColor: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    success: { iconColor: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    info: { iconColor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* ═══ KPI METRIC CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Icon circle */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.accent} flex items-center justify-center text-white mb-4`}>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight mb-1" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              {kpi.value}
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SMART FOCUS ═══ */}
      {smartFocusAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A3FF] to-[#0057FF] flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Smart Focus
            </h2>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">
              Actions prioritaires
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {smartFocusAlerts.map((alert, idx) => {
              const styles = alertStyles[alert.type]
              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${styles.bg} border ${styles.border} rounded-xl px-4 py-3`}
                >
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-800">
                    <span className={`${styles.iconColor} shrink-0`}>{alert.icon}</span>
                    {alert.text}
                  </div>
                  <Link
                    href={alert.href}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-br from-[#00A3FF] to-[#0057FF] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                  >
                    {alert.action}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ URSSAF SIMULATOR ═══ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Simulateur URSSAF
          </h2>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">
            Auto-entrepreneur
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(() => {
            const urssafRate = 0.212
            const grossRevenue = totalTTC
            const urssafTax = grossRevenue * urssafRate
            const netIncome = grossRevenue - urssafTax
            return [
              { label: "Chiffre d'affaires brut", value: formatCurrency(grossRevenue), color: 'text-gray-900' },
              { label: 'Cotisations URSSAF (21.2%)', value: `- ${formatCurrency(urssafTax)}`, color: 'text-red-600' },
              { label: 'Revenu net estime', value: formatCurrency(netIncome), color: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className={`text-xl font-bold ${item.color} tracking-tight mb-1`} style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                  {item.value}
                </div>
                <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  {item.label}
                </div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* ═══ REVENUE CHART + RECENT INVOICES ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Revenue Chart — 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Revenus (6 derniers mois)
            </h2>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              Tendance
            </span>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0057FF" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0057FF" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#F3F4F6' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: 13,
                  }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenu']}
                  labelStyle={{ color: '#6B7280', fontWeight: 600, fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0057FF"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ r: 4, fill: '#0057FF', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0057FF', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Factures recentes
            </h2>
            <Link href="/invoices" className="text-xs font-semibold text-[#0057FF] hover:text-[#00A3FF] transition-colors">
              Voir tout
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            {recentInvoices.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                Aucune facture pour le moment.
              </div>
            )}
            {recentInvoices.map((inv) => {
              const badge = statusBadge[inv.status] ?? statusBadge.draft
              const ht = calculateHT(inv.items ?? [])
              const ttc = calculateTTC(ht, inv.tva_rate)
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="group no-underline">
                  <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 font-mono">
                          {inv.invoice_number}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {inv.client?.name ?? '---'}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-gray-900">
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
