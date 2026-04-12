'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  /** Show an Abloh-style micro-label above the button (e.g. "ACTION_BUTTON") */
  label?: string;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  loading = false,
  label,
}: ButtonProps) {
  const base = [
    'relative inline-flex items-center justify-center gap-2',
    'px-5 py-2.5',
    'text-[13px] font-black uppercase tracking-[0.08em]',
    'border border-zinc-900',
    'transition-all duration-100',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'cursor-pointer',
    'select-none',
  ].join(' ');

  const variants: Record<string, string> = {
    primary: 'bg-zinc-900 text-white hover:bg-[#0052FF]',
    secondary: 'bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-900',
    danger: 'bg-[#FF5C00] text-white border-[#FF5C00] hover:bg-[#e05200]',
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {label && (
        <span className="label-abloh">{label}</span>
      )}
      <button
        type={type}
        className={`${base} ${variants[variant]} ${className}`}
        disabled={disabled || loading}
        onClick={onClick}
      >
        {loading && (
          <svg
            className="animate-spin h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    </div>
  );
}
