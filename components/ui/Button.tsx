'use client'

import type { ButtonHTMLAttributes } from 'react'
import { cn } from './utils'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export function Button({
  variant = 'ghost',
  size = 'md',
  loading,
  className,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}) {
  const base = 'ui-btn inline-flex items-center justify-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed'
  const variants: Record<Variant, string> = {
    primary: 'ui-btn-primary',
    ghost: 'ui-btn-ghost',
    danger: 'ui-btn-danger',
  }
  const sizes: Record<Size, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading && <span className="ui-spinner !w-4 !h-4 !border-[2px]" aria-hidden="true" />}
      {children}
    </button>
  )
}
