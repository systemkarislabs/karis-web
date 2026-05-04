'use client'

import Link from 'next/link'
import { Card } from './Card'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-5xl mx-auto w-full" style={{ padding: 28 }}>
      <Card className="p-7">
        <div className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {title}
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Esta seção está em construção.
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="ui-btn"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 650,
              fontSize: 13,
            }}
          >
            Voltar ao dashboard
          </Link>
          <Link
            href="/multi-chat"
            className="ui-btn"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--primary)',
              background: 'color-mix(in oklch, var(--primary) 6%, transparent)',
              color: 'var(--primary)',
              fontWeight: 650,
              fontSize: 13,
            }}
          >
            Ir para Multi Chat
          </Link>
        </div>
      </Card>
    </div>
  )
}

