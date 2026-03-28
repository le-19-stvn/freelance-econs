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
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  loading = false,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'bg-[var(--blue-primary)] text-white',
    secondary:
      'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]',
    danger: 'bg-[var(--danger)] text-white',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
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
  );
}
