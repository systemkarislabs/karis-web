'use client'

import Link from 'next/link'
import { cn } from './utils'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: { label: string; href: string } | { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div className={cn('ui-card rounded-[var(--radius-xl)] p-6 text-center', className)}>
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {'href' in action ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center ui-btn ui-btn-primary h-10 px-4 text-sm font-medium rounded-[var(--radius-md)]"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center ui-btn ui-btn-primary h-10 px-4 text-sm font-medium rounded-[var(--radius-md)]"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
