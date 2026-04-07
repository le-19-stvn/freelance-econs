'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual variant: 'default' = full border box, 'underline' = bottom border only */
  variant?: 'default' | 'underline';
  /** Abloh-style micro-label above the input */
  label?: string;
  error?: string;
}

export function Input({
  variant = 'default',
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  const base = [
    'w-full px-3 py-2.5',
    'text-[13px] font-medium text-zinc-900',
    'bg-white',
    'placeholder:text-zinc-400 placeholder:font-normal',
    'outline-none',
    'transition-colors duration-100',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

  const variants: Record<string, string> = {
    default: 'border border-zinc-200 focus:border-zinc-900',
    underline: 'border-0 border-b border-zinc-300 focus:border-zinc-900 px-0',
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label-abloh">{label}</label>
      )}
      <input
        className={`${base} ${variants[variant]} ${error ? 'border-[#FF5C00]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[11px] font-semibold text-[#FF5C00] tracking-wide uppercase">
          {error}
        </span>
      )}
    </div>
  );
}
