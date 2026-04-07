'use client';

import React from 'react';

interface InputProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  readOnly = false,
  className = '',
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-black">
          {label}
          {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        className="bg-white border-2 border-zinc-950 px-3 py-2.5 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:shadow-brutal-sm transition-shadow duration-100 read-only:opacity-60 read-only:cursor-default"
      />
    </div>
  );
}
