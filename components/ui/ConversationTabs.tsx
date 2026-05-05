'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ConversationTabs() {
  const pathname = usePathname()
  const isList = pathname.startsWith('/conversas')
  const isMulti = pathname.startsWith('/multi-chat')

  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-fit"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      <Link
        href="/conversas"
        aria-label="Ver lista de conversas"
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: isList ? 'var(--teal)' : 'transparent', color: isList ? 'white' : 'var(--muted)' }}
      >
        Lista
      </Link>
      <Link
        href="/multi-chat"
        aria-label="Abrir Multi Chat"
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: isMulti ? 'var(--teal)' : 'transparent', color: isMulti ? 'white' : 'var(--muted)' }}
      >
        Multi Chat
      </Link>
    </div>
  )
}

