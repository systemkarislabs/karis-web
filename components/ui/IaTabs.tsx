'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type IaTab = 'agente' | 'conhecimento' | 'treinamento'

function getTab(pathname: string, searchParams: URLSearchParams): IaTab {
  const raw = (searchParams.get('tab') ?? '').toLowerCase()
  if (raw === 'conhecimento') return 'conhecimento'
  if (raw === 'treinamento') return 'treinamento'
  if (raw === 'agente') return 'agente'
  if (pathname.startsWith('/conhecimento')) return 'conhecimento'
  if (pathname.startsWith('/treinamento')) return 'treinamento'
  return 'agente'
}

export function IaTabs() {
  const pathname = usePathname()
  const sp = useSearchParams()
  const tab = getTab(pathname, sp)

  const tabs: Array<{ id: IaTab; label: string; href: string; ariaLabel: string }> = [
    { id: 'agente', label: 'Agente IA', href: '/ia?tab=agente', ariaLabel: 'Configurar Agente IA' },
    { id: 'conhecimento', label: 'Conhecimento', href: '/ia?tab=conhecimento', ariaLabel: 'Gerenciar Base de Conhecimento' },
    { id: 'treinamento', label: 'Treinamento', href: '/ia?tab=treinamento', ariaLabel: 'Materiais de Treinamento' },
  ]

  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-fit"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      {tabs.map(t => (
        <Link
          key={t.id}
          href={t.href}
          aria-label={t.ariaLabel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: tab === t.id ? 'var(--teal)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--muted)',
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
