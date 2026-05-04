'use client'

import { cn } from './utils'

type Variant = 'neutral' | 'success' | 'warning' | 'danger'

export function Badge({
  variant = 'neutral',
  dot,
  className,
  children,
}: {
  variant?: Variant
  dot?: boolean
  className?: string
  children: React.ReactNode
}) {
  const styles: Record<Variant, { bg: string; fg: string; dot: string }> = {
    neutral: { bg: '#F3F4F6', fg: '#6B7280', dot: '#9CA3AF' },
    success: { bg: '#D1FAE5', fg: '#065F46', dot: '#10B981' },
    warning: { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' },
    danger: { bg: '#FEF2F2', fg: '#991B1B', dot: '#EF4444' },
  }

  const s = styles[variant]

  return (
    <span className={cn('ui-badge', className)} style={{ background: s.bg, color: s.fg }}>
      {dot && <span className="ui-badge-dot" style={{ background: s.dot }} />}
      {children}
    </span>
  )
}
