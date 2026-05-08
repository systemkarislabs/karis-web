'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ConversationTabs() {
  const pathname = usePathname()
  const isList = pathname.startsWith('/conversas')
  const isMulti = pathname.startsWith('/multi-chat')

  return (
    <div
      className="finance-segmented w-fit"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      <Link
        href="/conversas"
        aria-label="Ver lista de conversas"
        className={isList ? 'active' : ''}
        style={{ textDecoration: 'none' }}
      >
        Lista
      </Link>
      <Link
        href="/multi-chat"
        aria-label="Abrir Multi Chat"
        className={isMulti ? 'active' : ''}
        style={{ textDecoration: 'none' }}
      >
        Multi Chat
      </Link>
    </div>
  )
}

