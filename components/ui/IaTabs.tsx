'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type IaTab = 'agente' | 'conhecimento'

function getTab(pathname: string, searchParams: URLSearchParams): IaTab {
  const raw = (searchParams.get('tab') ?? '').toLowerCase()
  if (raw === 'conhecimento') return 'conhecimento'
  if (raw === 'agente') return 'agente'
  if (pathname.startsWith('/conhecimento')) return 'conhecimento'
  return 'agente'
}

export function IaTabs() {
  const pathname = usePathname()
  const sp = useSearchParams()
  const tab = getTab(pathname, sp)

  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-fit"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      <Link
        href="/ia?tab=agente"
        aria-label="Configurar Agente IA"
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: tab === 'agente' ? 'var(--teal)' : 'transparent', color: tab === 'agente' ? 'white' : 'var(--muted)' }}
      >
        Agente IA
      </Link>
      <Link
        href="/ia?tab=conhecimento"
        aria-label="Gerenciar Base de Conhecimento"
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: tab === 'conhecimento' ? 'var(--teal)' : 'transparent', color: tab === 'conhecimento' ? 'white' : 'var(--muted)' }}
      >
        Base de Conhecimento
      </Link>
    </div>
  )
}

