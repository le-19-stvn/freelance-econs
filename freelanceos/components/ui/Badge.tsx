'use client'

import { StatusBadge } from './StatusBadge'

type BadgeVariant = 'draft' | 'sent' | 'paid' | 'late' | 'ongoing' | 'done'

interface BadgeProps {
  variant: BadgeVariant
}

export function Badge({ variant }: BadgeProps) {
  return <StatusBadge variant={variant} />
}
