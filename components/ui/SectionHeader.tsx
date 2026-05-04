'use client'

import { cn } from './utils'

export function SectionHeader({
  title,
  description,
  right,
  className,
}: {
  title: string
  description?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-xl font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        )}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  )
}
