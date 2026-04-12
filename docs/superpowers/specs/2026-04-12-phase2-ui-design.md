# Phase 2 — UI/UX Design Spec

**Date**: 2026-04-12
**Branch**: `refactor/ui-bases`
**Scope**: Design system tokens, reusable components (KPICard, StatusBadge, FormInput), Dashboard Bento Grid refactor.

---

## 1. Design Principles

- **Rule of 3 colors**: off-white, vibrant blue, soft black — no pure #FFFFFF or #000000
- **Elevated cards**: depth via multi-layer shadows, zero borders on cards
- **Typographic impact**: massive KPI numbers with negative tracking
- **Minimal chrome**: the content IS the interface — no decorative noise
- **Light mode only**

### What makes this NOT generic

| Anti-pattern (AI slop) | Our approach |
|------------------------|--------------|
| Flat white cards with `border-gray-200` | Elevated cards, multi-layer shadows, no borders |
| `shadow-md` everywhere | Two-layer shadow: `0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)` |
| Rainbow status pills | Monochrome dot + label on zinc-100 |
| White hero card | Dark gradient hero (zinc-900 → zinc-800) |
| Blue accent as flat bg | Blue-700 with colored glow shadow |
| Generic `text-3xl` KPIs | `text-4xl/5xl font-bold tracking-tight` — statement typography |

---

## 2. Color Palette

```
Background:     #F4F4F5  (zinc-50)
Surface:        #FFFFFF  (cards)
Text primary:   #18181B  (zinc-900)
Text secondary: #71717A  (zinc-500)
Accent:         #1D4ED8  (blue-700)
Accent light:   #1D4ED812 (blue-700/7% — hover states)
Dividers:       #E4E4E7  (zinc-200 — tables/lists only, NOT card borders)
Subtle bg:      #F4F4F5  (zinc-100 — badge backgrounds, input bg)
```

### Status dot colors (used ONLY in StatusBadge dot)

```
draft:    #A1A1AA  (zinc-400)
sent:     #1D4ED8  (blue-700)
paid:     #10B981  (emerald-500)
late:     #EF4444  (red-500)
ongoing:  #1D4ED8  (blue-700)
done:     #10B981  (emerald-500)
```

---

## 3. Typography

- **Font**: Inter (400, 500, 600, 700) via Google Fonts
- **KPI values**: `text-4xl font-bold tracking-tight` (cards), `text-5xl font-bold tracking-tight` (hero)
- **Labels**: `text-[11px] uppercase tracking-[0.05em] font-medium text-zinc-500`
- **Body**: `text-sm text-zinc-700`
- **Sub-labels**: `text-xs text-zinc-500`

---

## 4. Card System

### Base card

```
bg-white rounded-2xl p-6
shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)
no border
```

### Hero card (revenue)

```
bg-gradient: from-zinc-900 to-zinc-800
rounded-3xl p-8
shadow: 0 4px 24px rgba(0,0,0,0.12)
text: white
content: CA amount (text-5xl), factures payées count, optional sparkline
NO CTA button in hero
```

### Accent card (blue)

```
bg-blue-700
rounded-2xl p-6
shadow: 0 4px 16px rgba(29,78,216,0.25)  ← blue glow
text: white
```

---

## 5. Components

### 5.1 KPICard

**File**: `components/ui/KPICard.tsx`

```typescript
interface KPICardProps {
  label: string        // uppercase label
  value: string | number
  sub?: string         // optional sub-label
  accent?: boolean     // blue variant
  className?: string
}
```

- Default: white elevated card, zinc-900 value
- `accent=true`: blue-700 bg, white text, blue glow shadow
- Label → value → sub vertical stack
- Value: `text-4xl font-bold tracking-tight`

### 5.2 StatusBadge

**File**: `components/ui/StatusBadge.tsx`

```typescript
type StatusVariant = 'draft' | 'sent' | 'paid' | 'late' | 'ongoing' | 'done'

interface StatusBadgeProps {
  variant: StatusVariant
  label?: string      // override display text
  className?: string
}
```

- Layout: `inline-flex items-center gap-2`
- Container: `bg-zinc-100 rounded-full px-3 py-1.5`
- Dot: `w-2 h-2 rounded-full` + variant color
- Text: `text-xs font-medium text-zinc-700`
- Default labels: Brouillon, Envoyée, Payée, En retard, En cours, Terminé

### 5.3 FormInput (update existing Input.tsx)

**File**: `components/ui/Input.tsx`

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  className?: string
}
```

- Container: `rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3`
- Focus: `ring-2 ring-blue-700/20 border-blue-700`
- Label: `text-sm font-medium text-zinc-700 mb-1.5`
- Error: `text-xs text-red-500 mt-1`
- Remove all Abloh-style label logic

---

## 6. Dashboard Bento Grid Layout

**File**: `app/(dashboard)/page.tsx`

### Grid structure

```
Desktop (lg): 4 columns, gap-4
Tablet (md):  2 columns, gap-4
Mobile:       1 column, gap-3

Row 1:  [Hero Revenue ————————————— col-span-full]
Row 2:  [KPI En attente] [KPI Projets] [KPI TVA] [KPI Total factures (accent)]
Row 3:  [Smart Focus —— col-span-2]   [URSSAF Sim —— col-span-2]
Row 4:  [Revenue Chart —— col-span-2] [Factures récentes — col-span-2]
```

### Section details

- **Hero**: dark gradient, CA massif, count factures payées
- **KPI row**: 4x KPICard, last one `accent=true`
- **Smart Focus**: white elevated card, list of action items (max 3), icon per type
- **URSSAF**: white elevated card, CA brut → cotisations → revenu net breakdown
- **Chart**: white elevated card, Recharts AreaChart, 6 months, area fill blue-700/10
- **Factures**: white elevated card, table with StatusBadge, amounts, dates

### Animations

- Cards: `animate-in` with staggered `animation-delay` (50ms increments)
- Keyframe: fade-in + slight translateY(8px → 0)
- Duration: 400ms, ease-out
- Only on initial page load

---

## 7. Files to modify

| File | Action |
|------|--------|
| `tailwind.config.ts` | Already done — Inter font, default border-radius restored |
| `app/globals.css` | Already done — Inter import, zinc-50 bg, no border-radius reset. Add fade-in keyframe. |
| `components/ui/KPICard.tsx` | **Create** — new component |
| `components/ui/StatusBadge.tsx` | **Create** — new component |
| `components/ui/Input.tsx` | **Update** — remove Abloh style, apply new design |
| `app/(dashboard)/page.tsx` | **Rewrite** — Bento Grid with new components |

---

## 8. Out of scope

- Dark mode
- React Query migration (Phase 3)
- Tests (Phase 5)
- Sidebar/layout redesign (separate task)
- Other pages (clients, projects, invoices, settings)
