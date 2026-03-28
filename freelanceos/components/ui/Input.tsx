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
        <label className="text-[9px] uppercase tracking-[1.5px] text-[var(--muted)] font-medium">
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
        className="bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-md px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue-primary)] transition-colors duration-150 read-only:opacity-60 read-only:cursor-default"
      />
    </div>
  );
}
