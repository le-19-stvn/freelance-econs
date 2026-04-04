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

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#F1F1F5', color: '#555', label: 'Brouillon' },
  sent: { bg: 'var(--blue-surface)', color: 'var(--blue-primary)', label: 'Envoyee' },
  paid: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Payee' },
  late: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'En retard' },
}

// Generate last 6 months labels
function getLast6Months(): string[] {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(
      d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    )
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
    { label: "Chiffre d'affaires", value: formatCurrency(totalTTC) },
    { label: 'Factures en attente', value: String(pendingCount) },
    { label: 'Projets actifs', value: String(activeProjects) },
    { label: 'Taux TVA moyen', value: `${avgTVA.toFixed(1)}%` },
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

    // Late invoices
    invoices
      .filter((inv) => inv.status === 'late')
      .slice(0, 2)
      .forEach((inv) => {
        const daysLate = inv.due_date
          ? Math.ceil(
              (Date.now() - new Date(inv.due_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0
        alerts.push({
          type: 'warning',
          icon: <AlertTriangle size={18} />,
          text: `Facture ${inv.invoice_number} en retard de ${daysLate} jour(s)`,
          action: 'Envoyer un rappel',
          href: `/invoices/${inv.id}`,
        })
      })

    // Projects done without invoice
    projects
      .filter((p) => p.status === 'done' && !p.invoice_generated)
      .slice(0, 2)
      .forEach((p) => {
        alerts.push({
          type: 'success',
          icon: <CheckCircle2 size={18} />,
          text: `Projet "${p.name}" termine`,
          action: 'Generer la facture',
          href: '/invoices/new',
        })
      })

    // Draft invoices waiting
    invoices
      .filter((inv) => inv.status === 'draft')
      .slice(0, 1)
      .forEach((inv) => {
        alerts.push({
          type: 'info',
          icon: <Clock size={18} />,
          text: `Facture ${inv.invoice_number} en brouillon`,
          action: 'Finaliser',
          href: `/invoices/${inv.id}`,
        })
      })

    // Show max 3
    return alerts.slice(0, 3)
  }, [invoices, projects])

  // Revenue chart data — aggregate paid invoices by month
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

  if (loadingInv || loadingProj) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: 14, padding: 32 }}>
        Chargement...
      </div>
    )
  }

  const alertColors = {
    warning: {
      iconColor: '#B45309',
      bg: 'rgba(254, 243, 199, 0.5)',
    },
    success: {
      iconColor: '#0D9E6B',
      bg: 'rgba(230, 247, 242, 0.5)',
    },
    info: {
      iconColor: '#1A3FA3',
      bg: 'rgba(235, 242, 250, 0.5)',
    },
  }

  return (
    <div>
      {/* KPI Cards — responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8 md:mb-10">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '20px 18px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: 'linear-gradient(to bottom, #00B4D8, #1A3FA3)',
              }}
            />
            <div className="text-xl md:text-[28px] font-extrabold" style={{ color: 'var(--blue-primary)', marginBottom: 6 }}>
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: 'var(--muted)',
                fontWeight: 500,
              }}
            >
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Focus Section */}
      <div
        className="mb-8 md:mb-10"
        style={{
          background: 'rgba(235, 242, 250, 0.5)',
          border: '1px solid #D4E1F4',
          borderRadius: 16,
          padding: '24px',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color: 'var(--blue-primary)' }} />
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: -0.3,
            }}
          >
            Smart Focus
          </h2>
          <span
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: 'var(--muted)',
              fontWeight: 500,
              marginLeft: 4,
            }}
          >
            Actions prioritaires
          </span>
        </div>

        {smartFocusAlerts.length === 0 ? (
          <div
            className="flex items-center gap-3 py-3"
            style={{ color: 'var(--muted)', fontSize: 13 }}
          >
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            Tout est a jour. Aucune action requise.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {smartFocusAlerts.map((alert, idx) => {
              const colors = alertColors[alert.type]
              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{
                    background: colors.bg,
                    borderRadius: 10,
                    padding: '14px 18px',
                  }}
                >
                  <div
                    className="flex items-center gap-3"
                    style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 500 }}
                  >
                    <span style={{ color: colors.iconColor, flexShrink: 0 }}>
                      {alert.icon}
                    </span>
                    {alert.text}
                  </div>
                  <Link
                    href={alert.href}
                    className="flex items-center gap-1.5 flex-shrink-0"
                    style={{
                      background: 'var(--blue-primary)',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--blue-mid)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--blue-primary)'
                    }}
                  >
                    {alert.action}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* URSSAF Simulator Card */}
      <div
        className="mb-8 md:mb-10"
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #111 0%, #555 100%)',
        }} />
        <div className="flex items-center gap-2 mb-5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
            Simulateur URSSAF
          </h2>
          <span style={{
            fontSize: 9, textTransform: 'uppercase', letterSpacing: 2,
            color: 'var(--muted)', fontWeight: 500, marginLeft: 4,
          }}>
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
              { label: 'Chiffre d\'affaires brut', value: formatCurrency(grossRevenue), color: 'var(--ink)' },
              { label: 'Cotisations URSSAF (21.2%)', value: `- ${formatCurrency(urssafTax)}`, color: 'var(--danger, #EF4444)' },
              { label: 'Revenu net estimé', value: formatCurrency(netIncome), color: 'var(--success, #059669)' },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'var(--bg)', borderRadius: 10, padding: '16px 18px',
                border: '1px solid var(--line)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginBottom: 4 }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5,
                  color: 'var(--muted)', fontWeight: 600,
                }}>
                  {item.label}
                </div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Revenue + Recent Invoices — 2-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
        {/* Revenue Chart — takes 3/5 */}
        <div
          className="lg:col-span-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Revenus (6 derniers mois)
            </h2>
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: 'var(--muted)',
                fontWeight: 500,
              }}
            >
              Tendance
            </span>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A3FA3" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1A3FA3" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E4E6ED"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E4E6ED' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E4E6ED',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 13,
                  }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenu']}
                  labelStyle={{ color: '#6B7280', fontWeight: 600, fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A3FA3"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={{ r: 4, fill: '#1A3FA3', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#1A3FA3', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices — takes 2/5 */}
        <div
          className="lg:col-span-2"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '24px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Factures recentes
            </h2>
            <Link
              href="/invoices"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--blue-primary)',
                textDecoration: 'none',
              }}
            >
              Voir tout
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            {recentInvoices.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Aucune facture pour le moment.
              </div>
            )}
            {recentInvoices.map((inv) => {
              const badge = statusBadge[inv.status] ?? statusBadge.draft
              const ht = calculateHT(inv.items ?? [])
              const ttc = calculateTTC(ht, inv.tva_rate)
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="flex items-center justify-between gap-3"
                    style={{
                      borderRadius: 8,
                      padding: '10px 14px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex-shrink-0"
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          textTransform: 'uppercase',
                        }}
                      >
                        {badge.label}
                      </span>
                      <div className="min-w-0">
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--ink)',
                            fontFamily: 'monospace',
                            fontSize: 12,
                          }}
                        >
                          {inv.invoice_number}
                        </div>
                        <div
                          className="truncate"
                          style={{ color: 'var(--muted)', fontSize: 11 }}
                        >
                          {inv.client?.name ?? '---'}
                        </div>
                      </div>
                    </div>
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontWeight: 800,
                        color: 'var(--blue-primary)',
                        fontSize: 13,
                      }}
                    >
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
