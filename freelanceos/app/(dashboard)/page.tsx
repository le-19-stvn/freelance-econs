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
import { KPICard } from '@/components/ui/KPICard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProGate } from '@/components/ui/ProGate'

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
  const [planType, setPlanType] = useState<string>('free')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [annualGoal, setAnnualGoal] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('tva_rate, plan_type, full_name, annual_goal')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfileTvaRate(data.tva_rate ?? 0)
        setPlanType(data.plan_type ?? 'free')
        // First word of full_name, fallback to email local part
        const first = (data.full_name as string | null)?.trim().split(/\s+/)[0] ?? null
        setFirstName(first || (user.email?.split('@')[0] ?? null))
        setAnnualGoal(data.annual_goal ?? null)
      }
    })()
  }, [])

  // "avril 2026" — locale fr
  const monthLabel = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

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
          icon: <Clock size={14} />,
          text: `${inv.invoice_number} en brouillon`,
          action: 'Finaliser',
          href: `/invoices/${inv.id}`,
        })
      })

    return alerts.slice(0, 3)
  }, [safeInvoices, safeProjects])

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

  const urssafRate = 0.212
  const grossRevenue = totalTTC
  const urssafTax = grossRevenue * urssafRate
  const netIncome = grossRevenue - urssafTax

  // Previsionnel
  const sentTotal = safeInvoices
    .filter((i) => i.status === 'sent')
    .reduce((sum, inv) => {
      const ht = calculateHT(inv.items ?? [])
      return sum + calculateTTC(ht, inv.tva_rate)
    }, 0)

  const ongoingBudget = safeProjects
    .filter((p) => p.status === 'ongoing' && p.budget > 0)
    .reduce((sum, p) => sum + p.budget, 0)

  const previsionnel = sentTotal + ongoingBudget

  const recentInvoices = safeInvoices.slice(0, 5)

  /* ── Loading skeleton ── */
  if (loadingInv || loadingProj) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-full bg-zinc-800/50 rounded-3xl p-8 animate-pulse h-44" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-elevated animate-pulse p-6">
              <div className="h-2 w-16 bg-zinc-100 rounded-full mb-4" />
              <div className="h-8 w-20 bg-zinc-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const alertIconColors = {
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    info: 'text-zinc-400',
  }

  // Progress vs annual goal (0-100, capped)
  const goalPct =
    annualGoal && annualGoal > 0
      ? Math.max(0, Math.min(100, Math.round((totalTTC / annualGoal) * 100)))
      : 0

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ═══ GREETING ═══ */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Bonjour{firstName ? `, ${firstName}` : ''}
          <span className="text-zinc-400 font-normal"> — {monthLabel}.</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Voici l&apos;etat de votre activite ce mois-ci.
        </p>
      </div>

      {/* ═══ ROW 1: Hero Revenue + Annual Goal ═══ */}
      <div
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 md:p-10 animate-fade-in animate-stagger-1 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 md:gap-10 items-end"
      >
        {/* Left: revenue */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-white/40 mb-4">
            Chiffre d&apos;affaires — {new Date().getFullYear()}
          </div>
          <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-none">
            {formatCurrency(totalTTC)}
          </div>
          <div className="flex items-center gap-3 mt-5">
            <div className="h-px w-8 bg-white/20" />
            <span className="text-sm text-white/40">
              {paidInvoices.length} facture{paidInvoices.length !== 1 ? 's' : ''} payée{paidInvoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Right: annual goal */}
        <div className="md:border-l md:border-white/10 md:pl-8">
          {annualGoal && annualGoal > 0 ? (
            <>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.05em] font-medium text-white/40 mb-3">
                <span>Objectif annuel</span>
                <span>{new Date().getFullYear()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-300 transition-all duration-700 ease-out"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>
                  <span className="text-white font-medium">{formatCurrency(totalTTC)}</span> encaisses
                </span>
                <span className="text-white/50">
                  / {formatCurrency(annualGoal)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-white/40">
                Objectif annuel
              </div>
              <p className="text-sm text-white/60 leading-snug">
                Fixez-vous un cap pour {new Date().getFullYear()} et suivez votre progression chaque jour.
              </p>
              <Link
                href="/parametres"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Definir mon objectif
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ROW 2: KPI Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="En attente"
          value={pendingCount}
          sub="Factures"
          className="animate-fade-in animate-stagger-2"
        />
        <KPICard
          label="Projets actifs"
          value={activeProjects}
          sub="En cours"
          className="animate-fade-in animate-stagger-3"
        />
        <KPICard
          label={profileTvaRate === 0 ? 'Non assujetti' : 'Taux TVA'}
          value={tvaDisplay}
          className="animate-fade-in animate-stagger-4"
        />
        <KPICard
          label="Total factures"
          value={safeInvoices.length}
          sub="Factures"
          accent
          className="animate-fade-in animate-stagger-5"
        />
        <ProGate planType={planType}>
          <KPICard
            label="Previsionnel"
            value={formatCurrency(previsionnel)}
            sub={`${formatCurrency(sentTotal)} en attente · ${formatCurrency(ongoingBudget)} en cours`}
          />
        </ProGate>
      </div>

      {/* ═══ ROW 3: Smart Focus + URSSAF ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Smart Focus */}
        <div className="bg-white rounded-2xl shadow-elevated p-6 animate-fade-in animate-stagger-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Smart Focus</h2>
              <span className="text-xs text-zinc-500">Actions prioritaires</span>
            </div>
          </div>

          {smartFocusAlerts.length === 0 ? (
            <div className="rounded-xl bg-zinc-50 px-4 py-8 text-center">
              <CheckCircle2 size={20} className="mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400">Aucune action requise</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {smartFocusAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3 text-sm text-zinc-700">
                    <span className={alertIconColors[alert.type]}>{alert.icon}</span>
                    {alert.text}
                  </div>
                  <Link
                    href={alert.href}
                    className="inline-flex items-center gap-1.5 bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {alert.action}
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URSSAF Simulator */}
        <ProGate planType={planType}>
          <div className="bg-white rounded-2xl shadow-elevated p-6 animate-fade-in animate-stagger-7">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-semibold text-zinc-900">Simulateur URSSAF</h2>
              <span className="text-xs text-zinc-500">Auto-entrepreneur · 21.2%</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-2xl font-bold text-zinc-900 tracking-tight leading-none mb-1">
                  {formatCurrency(grossRevenue)}
                </div>
                <div className="text-xs text-zinc-500">CA Brut</div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-2xl font-bold text-zinc-400 tracking-tight leading-none mb-1">
                  - {formatCurrency(urssafTax)}
                </div>
                <div className="text-xs text-zinc-500">Cotisations</div>
              </div>
              <div className="rounded-xl bg-blue-700 p-4 shadow-blue-glow">
                <div className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
                  {formatCurrency(netIncome)}
                </div>
                <div className="text-xs text-white/70">Revenu Net</div>
              </div>
            </div>
          </div>
        </ProGate>
      </div>

      {/* ═══ ROW 4: Revenue Chart + Recent Invoices ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Revenue Chart — 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-elevated p-6 animate-fade-in animate-stagger-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Revenus</h2>
              <span className="text-xs text-zinc-500">6 derniers mois</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-700" />
              <span className="text-xs text-zinc-500">Tendance</span>
            </div>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#71717A', fontWeight: 500 }}
                  axisLine={{ stroke: '#E4E4E7' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v + '\u00a0€'}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181B',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                    fontWeight: 500,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: 11 }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1D4ED8"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={{ r: 3, fill: '#1D4ED8', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#1D4ED8', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-elevated p-6 animate-fade-in animate-stagger-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Factures</h2>
              <span className="text-xs text-zinc-500">Récentes</span>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Tout voir
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col">
            {recentInvoices.length === 0 && (
              <div className="text-center py-10 rounded-xl bg-zinc-50">
                <div className="text-4xl font-bold text-zinc-200 tracking-tight mb-2">0</div>
                <div className="text-sm text-zinc-400">Aucune facture</div>
              </div>
            )}
            {recentInvoices.map((inv) => {
              const ht = calculateHT(inv.items ?? [])
              const ttc = calculateTTC(ht, inv.tva_rate)
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="group no-underline">
                  <div className="flex items-center justify-between gap-3 px-3 py-3 -mx-1 hover:bg-zinc-50 transition-colors rounded-xl border-b border-zinc-100 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge variant={inv.status as 'draft' | 'sent' | 'paid' | 'late'} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900">
                          {inv.invoice_number}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {inv.client?.name ?? '---'}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-zinc-900 tracking-tight">
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
