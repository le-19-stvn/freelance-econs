'use client';

import React from 'react';

type BadgeVariant = 'draft' | 'sent' | 'paid' | 'late' | 'ongoing' | 'done';

interface BadgeProps {
  variant: BadgeVariant;
}

const colorMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  draft:   { bg: '#F4F4F5', text: '#71717A', border: '#D4D4D8' },
  sent:    { bg: '#F4F4F5', text: '#18181B', border: '#D4D4D8' },
  paid:    { bg: '#00E67614', text: '#00C853', border: '#00E67640' },
  late:    { bg: '#FF5C0014', text: '#FF5C00', border: '#FF5C0040' },
  ongoing: { bg: '#0052FF14', text: '#0052FF', border: '#0052FF40' },
  done:    { bg: '#00E67614', text: '#00C853', border: '#00E67640' },
};

const labelMap: Record<BadgeVariant, string> = {
  draft: 'BROUILLON',
  sent: 'ENVOYÉ',
  paid: 'PAYÉ',
  late: 'EN RETARD',
  ongoing: 'EN COURS',
  done: 'TERMINÉ',
};

export function Badge({ variant }: BadgeProps) {
  const colors = colorMap[variant];

  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] border"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {labelMap[variant]}
    </span>
  );
}
