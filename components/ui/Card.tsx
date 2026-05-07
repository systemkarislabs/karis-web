'use client'

import { cn } from './utils'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('ui-card rounded-[var(--radius-xl)] overflow-hidden', className)}>
      {children}
    </div>
  )
}
