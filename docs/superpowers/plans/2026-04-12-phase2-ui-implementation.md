# Phase 2 — UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the dashboard from the Null Studio monochrome design to an Elevated Bento Grid with the zinc-50/blue-700/zinc-900 palette, creating KPICard, StatusBadge components and rewriting the dashboard page.

**Architecture:** Create two new atomic components (KPICard, StatusBadge), update the existing Input component, add a fade-in animation keyframe to globals.css, update the tailwind config with new shadow/animation tokens, then rewrite the dashboard page to use these components in a Bento Grid layout. The existing Card component is NOT used by the dashboard — leave it untouched.

**Tech Stack:** Next.js 14 (App Router), TypeScript strict, Tailwind CSS, Recharts, Lucide React, Inter font (already imported).

**Design spec:** `docs/superpowers/specs/2026-04-12-phase2-ui-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `freelanceos/tailwind.config.ts` | Modify | Add fade-in keyframe + animation, elevated shadow token |
| `freelanceos/app/globals.css` | Modify | Add fade-in animation class with stagger support |
| `freelanceos/components/ui/KPICard.tsx` | Create | Reusable KPI display card (default + accent variant) |
| `freelanceos/components/ui/StatusBadge.tsx` | Create | Dot + monochrome label badge |
| `freelanceos/components/ui/Input.tsx` | Modify | Remove Abloh style, apply rounded-xl + blue-700 focus |
| `freelanceos/app/(dashboard)/page.tsx` | Rewrite | Bento Grid layout using new components |

---

### Task 1: Tailwind config — add animation + shadow tokens

**Files:**
- Modify: `freelanceos/tailwind.config.ts`

- [ ] **Step 1: Add keyframes, animation, and boxShadow to tailwind config**

Open `freelanceos/tailwind.config.ts` and add these entries inside `theme.extend`:

```typescript
keyframes: {
  shimmer: {
    '0%': { transform: 'translateX(-500%) skewX(-20deg)' },
    '100%': { transform: 'translateX(500%) skewX(-20deg)' },
  },
  'fade-in': {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  shimmer: 'shimmer 2.5s infinite linear',
  'fade-in': 'fade-in 0.4s ease-out both',
},
boxShadow: {
  'elevated': '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
  'elevated-lg': '0 4px 24px rgba(0,0,0,0.12)',
  'blue-glow': '0 4px 16px rgba(29,78,216,0.25)',
},
```

The existing `shimmer` keyframe and animation must be kept. Add `fade-in` alongside it. Add the new `boxShadow` key at the same level as `animation` inside `extend`.

- [ ] **Step 2: Verify the config compiles**

Run: `cd freelanceos && npx tailwindcss --content "./app/**/*.tsx" --output /dev/null 2>&1 | head -5`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add freelanceos/tailwind.config.ts
git commit -m "feat(ui): add fade-in animation and elevated shadow tokens to tailwind config"
```

---

### Task 2: globals.css — update palette variables + add stagger utility

**Files:**
- Modify: `freelanceos/app/globals.css`

- [ ] **Step 1: Update the CSS custom properties in `:root`**

Replace the entire `:root` block with the new palette. Keep the same variable names for backward compatibility but update the values:

```css
:root {
  /* ── Core palette (rule of 3: zinc-50 / blue-700 / zinc-900) ── */
  --bg: #F4F4F5;
  --surface: #FFFFFF;
  --ink: #18181B;
  --ink2: #27272A;
  --muted: #71717A;
  --line: #E4E4E7;

  /* ── Brand ── */
  --cobalt: #1D4ED8;
  --cobalt-light: #1D4ED812;

  /* ── Status ── */
  --success: #10B981;
  --success-bg: #10B98114;
  --warning: #F59E0B;
  --warning-bg: #F59E0B14;
  --danger: #EF4444;
  --danger-bg: #EF444414;

  /* ── Legacy compat ── */
  --industrial-orange: #F59E0B;
  --industrial-orange-bg: #F59E0B14;
  --neon-green: #10B981;
  --neon-green-bg: #10B98114;
  --blue-primary: #1D4ED8;
  --blue-mid: #1D4ED8;
  --blue-surface: #1D4ED80A;
  --cyan: #1D4ED8;
  --ec-navy: #1D4ED8;
  --ec-blue: #1D4ED8;
  --ec-cyan: #1D4ED8;
  --ec-navy-light: #1D4ED812;
  --ec-blue-light: #1D4ED814;
}
```

- [ ] **Step 2: Update body styles**

The body selector should already have Inter and #FAFAFA from our earlier edit. Update the background to match the new zinc-50:

```css
body {
  color: var(--ink);
  background: #F4F4F5;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 3: Remove the old Abloh label utility**

Delete the entire `.label-abloh` utility block (the class, `::before`, and `::after` rules) from the `@layer utilities` section. Keep `.text-balance` — it's useful.

- [ ] **Step 4: Add stagger animation utilities**

Add this inside `@layer utilities`, after `.text-balance`:

```css
  .animate-stagger-1 { animation-delay: 0ms; }
  .animate-stagger-2 { animation-delay: 50ms; }
  .animate-stagger-3 { animation-delay: 100ms; }
  .animate-stagger-4 { animation-delay: 150ms; }
  .animate-stagger-5 { animation-delay: 200ms; }
  .animate-stagger-6 { animation-delay: 250ms; }
  .animate-stagger-7 { animation-delay: 300ms; }
  .animate-stagger-8 { animation-delay: 350ms; }
```

- [ ] **Step 5: Commit**

```bash
git add freelanceos/app/globals.css
git commit -m "feat(ui): update palette to zinc-50/blue-700/zinc-900, add stagger utilities"
```

---

### Task 3: Create StatusBadge component

**Files:**
- Create: `freelanceos/components/ui/StatusBadge.tsx`

- [ ] **Step 1: Create the StatusBadge component**

Create `freelanceos/components/ui/StatusBadge.tsx` with this content:

```tsx
'use client'

type StatusVariant = 'draft' | 'sent' | 'paid' | 'late' | 'ongoing' | 'done'

interface StatusBadgeProps {
  variant: StatusVariant
  label?: string
  className?: string
}

const dotColors: Record<StatusVariant, string> = {
  draft: 'bg-zinc-400',
  sent: 'bg-blue-700',
  paid: 'bg-emerald-500',
  late: 'bg-red-500',
  ongoing: 'bg-blue-700',
  done: 'bg-emerald-500',
}

const defaultLabels: Record<StatusVariant, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  late: 'En retard',
  ongoing: 'En cours',
  done: 'Terminé',
}

export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 bg-zinc-100 rounded-full px-3 py-1.5 ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />
      <span className="text-xs font-medium text-zinc-700">
        {label ?? defaultLabels[variant]}
      </span>
    </span>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd freelanceos && npx tsc --noEmit --pretty 2>&1 | grep -i "StatusBadge" | head -5`

Expected: No errors mentioning StatusBadge (or no output at all).

- [ ] **Step 3: Commit**

```bash
git add freelanceos/components/ui/StatusBadge.tsx
git commit -m "feat(ui): create StatusBadge component with dot + monochrome label"
```

---

### Task 4: Create KPICard component

**Files:**
- Create: `freelanceos/components/ui/KPICard.tsx`

- [ ] **Step 1: Create the KPICard component**

Create `freelanceos/components/ui/KPICard.tsx` with this content:

```tsx
'use client'

interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
}

export function KPICard({ label, value, sub, accent = false, className = '' }: KPICardProps) {
  if (accent) {
    return (
      <div
        className={`bg-blue-700 rounded-2xl p-6 shadow-blue-glow ${className}`}
      >
        <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-white/70 mb-3">
          {label}
        </div>
        <div className="text-4xl font-bold tracking-tight text-white leading-none">
          {value}
        </div>
        {sub && (
          <div className="text-xs text-white/50 mt-2">{sub}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-elevated ${className}`}
    >
      <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-zinc-500 mb-3">
        {label}
      </div>
      <div className="text-4xl font-bold tracking-tight text-zinc-900 leading-none">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-zinc-500 mt-2">{sub}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd freelanceos && npx tsc --noEmit --pretty 2>&1 | grep -i "KPICard" | head -5`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add freelanceos/components/ui/KPICard.tsx
git commit -m "feat(ui): create KPICard component with default and accent variants"
```

---

### Task 5: Update Input component

**Files:**
- Modify: `freelanceos/components/ui/Input.tsx`

- [ ] **Step 1: Check where Input is used**

Run: `cd freelanceos && grep -r "import.*Input.*from.*components/ui/Input" --include="*.tsx" --include="*.ts" -l`

Note the files that import Input. The interface stays the same (`label`, `error`, `className`, plus HTML input attrs) so consumers won't break. The `variant` prop is removed — check if any consumer passes `variant="underline"`. If yes, those will need updating too.

- [ ] **Step 2: Rewrite Input.tsx**

Replace the entire content of `freelanceos/components/ui/Input.tsx` with:

```tsx
'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3',
          'text-sm text-zinc-900',
          'placeholder:text-zinc-400',
          'outline-none transition-all duration-150',
          'focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Check for consumers using `variant` prop**

Run: `cd freelanceos && grep -rn 'variant.*underline\|variant.*default' --include="*.tsx" -l | grep -v Input.tsx`

If any file uses `variant="underline"`, remove that prop from the consumer. The new Input has a single style.

- [ ] **Step 4: Verify it compiles**

Run: `cd freelanceos && npx tsc --noEmit --pretty 2>&1 | head -10`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add freelanceos/components/ui/Input.tsx
git commit -m "feat(ui): update Input with rounded-xl, zinc-50 bg, blue-700 focus ring"
```

---

### Task 6: Rewrite Dashboard page — Bento Grid

**Files:**
- Modify: `freelanceos/app/(dashboard)/page.tsx`

This is the largest task. The page keeps all its existing data logic (hooks, calculations, memos) but gets a completely new render. The imports change to use our new components.

- [ ] **Step 1: Replace the entire dashboard page**

Replace the full content of `freelanceos/app/(dashboard)/page.tsx` with:

```tsx
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

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ═══ ROW 1: Hero Revenue ═══ */}
      <div
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 md:p-10 animate-fade-in animate-stagger-1"
      >
        <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-white/40 mb-4">
          Chiffre d'affaires
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

      {/* ═══ ROW 2: KPI Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd freelanceos && npx next build 2>&1 | tail -15`

Expected: Build succeeds with no errors. Warnings about unused variables from other pages are fine.

- [ ] **Step 3: Visual verification**

Start the dev server and verify in browser:
- Background is zinc-50 (#F4F4F5)
- Hero card is dark gradient with massive white text
- KPI cards are white with shadows, no borders
- Last KPI card (Total factures) is blue with glow
- Status badges show colored dots with neutral text
- Cards animate in with staggered fade-in
- Chart uses blue-700 as stroke color
- Tooltip has dark zinc-900 background with rounded corners

- [ ] **Step 4: Commit**

```bash
git add freelanceos/app/(dashboard)/page.tsx
git commit -m "feat(ui): rewrite dashboard with Bento Grid layout and elevated design system"
```

---

### Task 7: Final build verification + cleanup

**Files:**
- All modified files from Tasks 1-6

- [ ] **Step 1: Run full build**

Run: `cd freelanceos && npx next build 2>&1 | tail -20`

Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 2: Check for unused imports of old Badge in dashboard**

Run: `cd freelanceos && grep -rn "label-abloh" --include="*.tsx" --include="*.css"`

Expected: No results — all Abloh references should be gone from modified files. If `label-abloh` still appears in other unmodified files (like the layout), that's fine — we're only changing dashboard-related files.

- [ ] **Step 3: Check that no file imports the old statusBadge map**

The old inline `statusBadge` record from the dashboard page should be gone, replaced by the StatusBadge component. Verify:

Run: `cd freelanceos && grep -rn "statusBadge\[" --include="*.tsx"`

Expected: No results.

- [ ] **Step 4: Final commit if any cleanup was needed**

If any cleanup was required, commit:
```bash
git add -A
git commit -m "chore: cleanup Phase 2 UI refactoring"
```
