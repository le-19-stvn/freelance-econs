'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3',
          'text-sm text-zinc-900',
          'placeholder:text-zinc-400',
          'outline-none transition-all duration-150',
          'focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}
