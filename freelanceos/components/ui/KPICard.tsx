'use client'

interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
}

export function KPICard({ label, value, sub, accent = false, className = '' }: KPICardProps) {
  if (accent) {
    return (
      <div
        className={`bg-blue-700 rounded-2xl p-6 shadow-blue-glow ${className}`}
      >
        <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-white/70 mb-3">
          {label}
        </div>
        <div className="text-4xl font-bold tracking-tight text-white leading-none">
          {value}
        </div>
        {sub && (
          <div className="text-xs text-white/50 mt-2">{sub}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-elevated ${className}`}
    >
      <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-zinc-500 mb-3">
        {label}
      </div>
      <div className="text-4xl font-bold tracking-tight text-zinc-900 leading-none">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-zinc-500 mt-2">{sub}</div>
      )}
    </div>
  )
}
