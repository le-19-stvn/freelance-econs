'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'

interface ProGateProps {
  children: React.ReactNode
  planType: string
  className?: string
}

export function ProGate({ children, planType, className = '' }: ProGateProps) {
  if (planType === 'pro') return <>{children}</>

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none blur-[6px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white">
          <Lock size={18} />
        </div>
        <Link
          href="/profile"
          className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
        >
          Passer au Pro
        </Link>
      </div>
    </div>
  )
}
