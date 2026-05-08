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

  const tabs: Array<{ id: IaTab; label: string; href: string; ariaLabel: string }> = [
    { id: 'agente', label: 'Agente e treinamento', href: '/ia?tab=agente', ariaLabel: 'Configurar agente e treinamento' },
    { id: 'conhecimento', label: 'Conhecimento', href: '/ia?tab=conhecimento', ariaLabel: 'Gerenciar Base de Conhecimento' },
  ]

  return (
    <div
      className="finance-segmented w-fit"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      {tabs.map(t => (
        <Link
          key={t.id}
          href={t.href}
          aria-label={t.ariaLabel}
          className={tab === t.id ? 'active' : ''}
          style={{
            textDecoration: 'none',
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
