# Phase 2b Vague 1 — Shared Components + Layout

**Date**: 2026-04-12
**Branch**: `main` (direct commits)
**Scope**: Update Button, Badge, Card, Layout to match the validated design system.

---

## Design System Reference

From Phase 2 spec:
- Background: `#F4F4F5` (zinc-50)
- Surface: `#FFFFFF` (cards, sidebar)
- Text: `#18181B` (zinc-900)
- Muted: `#71717A` (zinc-500)
- Accent: `#1D4ED8` (blue-700)
- Borders: `#E4E4E7` (zinc-200) — dividers only, never card borders
- Subtle border: `#F4F4F5` (zinc-100) — card section dividers
- Shadows: `shadow-elevated`, `shadow-blue-glow`
- Radius: `rounded-xl` (buttons, inputs, nav items), `rounded-2xl` (cards)

---

## 1. Button.tsx

**Remove:**
- `label` prop and `label-abloh` usage
- Wrapping `<div>` container (button should be standalone)
- `font-black uppercase tracking-[0.08em]` — too aggressive
- `border border-zinc-900` on all variants

**New styles:**

```
Base: rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-150
      disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
      active:scale-[0.98]  ← subtle press feedback, not generic

Primary:   bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md
Secondary: bg-zinc-100 text-zinc-900 hover:bg-zinc-200
Danger:    bg-red-500 text-white hover:bg-red-600
```

**Anti-slop details:**
- `active:scale-[0.98]` gives tactile press feedback
- Primary gets `shadow-sm` → `hover:shadow-md` for depth on hover
- No borders at all — shapes defined by background contrast

## 2. Badge.tsx

**Transform into a thin wrapper around StatusBadge:**

```tsx
import { StatusBadge } from './StatusBadge'

// Badge maps its variants to StatusBadge variants
export function Badge({ variant }: { variant: BadgeVariant }) {
  return <StatusBadge variant={variant} />
}
```

This preserves backward compatibility (invoices page imports Badge) while using the new dot+label design everywhere.

## 3. Card.tsx

**Remove:**
- `label` prop and `label-abloh` usage
- `border border-zinc-200`

**New styles:**
```
Card:       bg-white rounded-2xl shadow-elevated (no border)
CardHeader: px-6 py-4 border-b border-zinc-100
CardBody:   px-6 py-5
CardFooter: px-6 py-3 border-t border-zinc-100 bg-zinc-50/50
```

## 4. Layout (layout.tsx)

**Sidebar:**
- Background: `bg-white` (keep)
- Shadow: `shadow-elevated` instead of inline shadow
- Logo section: remove `(Nav)` IBM Plex Mono label
- Nav items: `rounded-xl` instead of `rounded-full`
- Active item: `bg-blue-700 text-white` instead of `bg-[#0a0a0a]`
- Hover: `hover:bg-zinc-100 text-zinc-600` instead of `hover:bg-[#f5f5f5]`
- Settings: same pattern as nav items, remove IBM Plex Mono `(Parametres)` label
- Dividers: `bg-zinc-100` instead of `bg-[#e7e7e7]`

**Header (topbar):**
- Background: `bg-white/80 backdrop-blur-lg` — glass effect, not generic solid white
- Border: `border-zinc-100` (lighter than current)
- Title: `text-sm font-semibold text-zinc-900` — clean, no tracking hacks
- Remove `(Header)` IBM Plex Mono label
- Bell icon: `hover:bg-zinc-100` instead of `hover:bg-[#f5f5f5]`
- Notification dot: `bg-blue-700` instead of `bg-[#0a0a0a]`

**HeaderProfile:**
- Remove `(User)` IBM Plex Mono label
- Avatar fallback: `bg-blue-700` instead of `bg-[#0a0a0a]`
- Name: `text-sm font-medium text-zinc-900`
- Border: `border-zinc-100`

**Notification panel:**
- Container: `rounded-2xl shadow-elevated-lg border border-zinc-100` — no `border-[#e7e7e7]`
- Accept button: `bg-blue-700 text-white rounded-lg` instead of `bg-[#0a0a0a] rounded-full`
- Decline button: `border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-lg`
- Badge count: `bg-blue-700` instead of `bg-[#0a0a0a]`

**Mobile sidebar:**
- Close button: `hover:bg-zinc-100 text-zinc-500`
- Same nav styling as desktop

**Footer:**
- Border: `border-zinc-100`

**Anti-slop details:**
- Glass header (`backdrop-blur-lg`) instead of solid white — adds depth when scrolling
- `rounded-xl` nav items with proper padding feel intentional, not default
- Blue-700 active state ties sidebar to the accent color system
- No IBM Plex Mono labels — they were the Abloh identity, not ours

## 5. LegalFooter.tsx

- Replace `#0a0a0a` with `text-zinc-500`
- Remove old tracking values

---

## Files to modify

| File | Action |
|------|--------|
| `components/ui/Button.tsx` | Rewrite |
| `components/ui/Badge.tsx` | Rewrite as StatusBadge wrapper |
| `components/ui/Card.tsx` | Update styles |
| `app/(dashboard)/layout.tsx` | Update all colors/styles |
| `components/ui/LegalFooter.tsx` | Minor color fix |

## Out of scope

- Page rewrites (clients, invoices, projects, etc.) — Vague 2+3
- UpgradeModal — Vague 4
- Toast.tsx, Modal.tsx — already use CSS variables, mostly clean
