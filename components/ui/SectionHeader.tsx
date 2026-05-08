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
    <div className={cn('finance-page-head', className)}>
      <div>
        <p className="finance-kicker">Karis Atende</p>
        <h1>{title}</h1>
        {description && (
          <span>
            {description}
          </span>
        )}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  )
}
