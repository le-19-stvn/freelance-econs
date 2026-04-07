'use client';

import React from 'react';

/* ═══════════════════════════════════════════════
   Card — Blueprint / Architectural Drawing Style
   ═══════════════════════════════════════════════ */

interface CardProps {
  /** Abloh-style technical label, e.g. "REF_DATA_001" */
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ label, children, className = '' }: CardProps) {
  return (
    <div className={`relative bg-white border border-zinc-200 ${className}`}>
      {/* Technical nomenclature label */}
      {label && (
        <span className="absolute top-2 right-2.5 label-abloh">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/* ── Sub-components ── */

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-5 py-4 border-b border-zinc-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 ${className}`}>
      {children}
    </div>
  );
}
