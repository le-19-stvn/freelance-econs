'use client';

import React from 'react';

type BadgeVariant = 'draft' | 'sent' | 'paid' | 'late' | 'ongoing' | 'done';

interface BadgeProps {
  variant: BadgeVariant;
}

const colorMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  draft: { bg: '#f4f4f0', text: '#52525b', border: '#52525b' },
  sent: { bg: 'var(--econic-black)', text: 'var(--econic-white)', border: 'var(--econic-black)' },
  paid: { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)' },
  late: { bg: 'var(--danger-bg)', text: 'var(--danger)', border: 'var(--danger)' },
  ongoing: { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning)' },
  done: { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)' },
};

export function Badge({ variant }: BadgeProps) {
  const colors = colorMap[variant];

  return (
    <span
      className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `2px solid ${colors.border}`,
      }}
    >
      {variant}
    </span>
  );
}
