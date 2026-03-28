'use client';

import React from 'react';

type BadgeVariant = 'draft' | 'sent' | 'paid' | 'late' | 'ongoing' | 'done';

interface BadgeProps {
  variant: BadgeVariant;
}

const colorMap: Record<BadgeVariant, { bg: string; text: string }> = {
  draft: { bg: '#F1F1F5', text: '#555555' },
  sent: { bg: 'var(--blue-surface)', text: 'var(--blue-primary)' },
  paid: { bg: 'var(--success-bg)', text: 'var(--success)' },
  late: { bg: 'var(--danger-bg)', text: 'var(--danger)' },
  ongoing: { bg: 'var(--blue-surface)', text: 'var(--blue-primary)' },
  done: { bg: 'var(--success-bg)', text: 'var(--success)' },
};

export function Badge({ variant }: BadgeProps) {
  const colors = colorMap[variant];

  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {variant}
    </span>
  );
}
