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
    neutral: { bg: 'rgba(6,30,68,.07)', fg: '#324255', dot: '#6B7A8C' },
    success: { bg: 'rgba(34,126,87,.12)', fg: '#1F6B4C', dot: '#2FA56E' },
    warning: { bg: 'rgba(184,135,84,.16)', fg: '#855D2B', dot: '#B88754' },
    danger: { bg: 'rgba(190,54,72,.11)', fg: '#A3293A', dot: '#D14A5E' },
  }

  const s = styles[variant]

  return (
    <span className={cn('ui-badge', className)} style={{ background: s.bg, color: s.fg }}>
      {dot && <span className="ui-badge-dot" style={{ background: s.dot }} />}
      {children}
    </span>
  )
}
