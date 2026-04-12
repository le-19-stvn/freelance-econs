'use client'

import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
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
  const base = [
    'inline-flex items-center justify-center gap-2',
    'rounded-xl px-5 py-2.5',
    'text-sm font-medium',
    'transition-all duration-150',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'cursor-pointer select-none',
    'active:scale-[0.98]',
  ].join(' ')

  const variants: Record<string, string> = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm hover:shadow-md',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

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
  )
}
