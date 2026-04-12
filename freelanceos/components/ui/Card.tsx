'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-elevated ${className}`}>
      {children}
    </div>
  )
}

interface CardSectionProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-b border-zinc-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-6 py-3 border-t border-zinc-100 bg-zinc-50/50 ${className}`}>
      {children}
    </div>
  )
}
