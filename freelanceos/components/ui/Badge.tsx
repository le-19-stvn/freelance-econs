'use client'

import { StatusBadge } from './StatusBadge'

type BadgeVariant =
  | 'draft' | 'sent' | 'paid' | 'late'
  | 'ongoing' | 'paused' | 'done' | 'archived'

interface BadgeProps {
  variant: BadgeVariant
}

export function Badge({ variant }: BadgeProps) {
  return <StatusBadge variant={variant} />
}
