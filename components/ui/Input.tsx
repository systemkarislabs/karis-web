'use client'

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from './utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'ui-input h-11 w-full rounded-[var(--radius-lg)] px-4 text-sm outline-none focus:ring-0 placeholder:text-[var(--subtle)]',
        className,
      )}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'ui-input w-full rounded-[var(--radius-lg)] px-4 py-3 text-sm outline-none focus:ring-0 min-h-[112px] resize-y placeholder:text-[var(--subtle)]',
        className,
      )}
    />
  )
}
