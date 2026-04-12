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
