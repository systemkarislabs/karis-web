'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Entitlements } from '@/lib/types'
import { DesignerIcon } from '@/components/ui/DesignerIcon'

type NavRequirement = 'ai' | 'whatsapp' | 'karisLink'

const navItemsBase: Array<{
  href: string
  label: string
  icon: ReactNode
  activePaths?: string[]
  requires?: NavRequirement
  requiresModule?: string
}> = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <DesignerIcon name="dashboard" size={18} />,
  },
  {
    href: '/conversas',
    label: 'Conversas',
    icon: <DesignerIcon name="chat" size={18} />,
    activePaths: ['/conversas', '/multi-chat'],
  },
  {
    href: '/contatos',
    label: 'Contatos',
    icon: <DesignerIcon name="users" size={18} />,
  },
  {
    href: '/whatsapp',
    label: 'WhatsApp',
    icon: <DesignerIcon name="whatsapp" size={18} />,
    requires: 'whatsapp',
  },
  {
    href: '/ia',
    label: 'IA',
    icon: <DesignerIcon name="bot" size={18} />,
    activePaths: ['/ia', '/assistente', '/conhecimento'],
    requires: 'ai',
  },
  {
    href: '/treinamento',
    label: 'Treinamento',
    icon: <DesignerIcon name="users" size={18} />,
  },
  {
    href: '/crm',
    label: 'CRM',
    icon: <DesignerIcon name="crm" size={18} />,
  },
  {
    href: '/campanhas',
    label: 'Campanhas',
    icon: <DesignerIcon name="campaign" size={18} />,
  },
  {
    href: '/marketing',
    label: 'Marketing',
    icon: <DesignerIcon name="marketing" size={18} />,
  },
  {
    href: '/calendario',
    label: 'Calendário',
    icon: <DesignerIcon name="calendar" size={18} />,
  },
  {
    href: '/cupons',
    label: 'Cupons',
    icon: <DesignerIcon name="coupon" size={18} />,
  },
  {
    href: '/afiliados',
    label: 'Afiliados',
    icon: <DesignerIcon name="affiliates" size={18} />,
  },
  {
    href: '/remuneracao',
    label: 'Remuneração',
    icon: <DesignerIcon name="payment" size={18} />,
  },
]

function Sidebar({ collapsed, onToggle, navItems }: { collapsed: boolean; onToggle: () => void; navItems: typeof navItemsBase }) {
  const pathname = usePathname()
  const router = useRouter()

  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false

  function isActiveItem(item: (typeof navItemsBase)[number]) {
    const paths = item.activePaths?.length ? item.activePaths : [item.href]
    return paths.some(p => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  }

  async function handleLogout() {
    localStorage.removeItem('karisAuthToken')
    localStorage.removeItem('karisCurrentUser')
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside
      className="flex flex-col h-full transition-all duration-200"
      style={{
        width: isMobile ? 280 : (collapsed ? 64 : 220),
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between gap-2.5 px-4"
        style={{
          height: 'calc(60px + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
        <img src="/designer/logo.svg" alt="" className="w-8 h-8 object-contain flex-shrink-0" />
        {(!collapsed || isMobile) && (
          <span className="text-[15px] font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--text)' }}>
            Karis Atende
          </span>
        )}
        </div>
        {isMobile ? (
          <button
            type="button"
            aria-label="Fechar menu"
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--muted)' }}
            onClick={onToggle}
          >
            <DesignerIcon name="menu" size={18} />
          </button>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isActiveItem(item)
          const activeBg = 'color-mix(in oklch, var(--primary) 8%, transparent)'
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="flex items-center gap-2.5 w-full rounded-lg text-[13.5px] font-medium transition-colors"
              style={{
                padding: collapsed && !isMobile ? '10px 0' : '9px 12px',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                background: active ? activeBg : 'transparent',
                color: active ? 'var(--primary)' : 'var(--muted)',
              }}
              title={collapsed ? item.label : undefined}
              onClick={() => { if (isMobile) onToggle() }}
            >
              <span className="flex-shrink-0" style={{ color: active ? 'var(--primary)' : 'var(--muted)' }}>
                {item.icon}
              </span>
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="flex items-center gap-2.5 w-full rounded-lg text-[13.5px] font-medium transition-colors"
          style={{
            padding: collapsed && !isMobile ? '10px 0' : '9px 12px',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            color: 'var(--muted)',
          }}
        >
          <DesignerIcon name="menu" size={17} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Menu</span>}
        </button>
        <Link
          href="/configuracoes"
          aria-label="Configurações"
          className="flex items-center gap-2.5 w-full rounded-lg text-[13.5px] font-medium transition-colors"
          style={{
            padding: collapsed && !isMobile ? '10px 0' : '9px 12px',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            color: 'var(--muted)',
          }}
          title={collapsed ? 'Configurações' : undefined}
          onClick={() => { if (isMobile) onToggle() }}
        >
          <DesignerIcon name="settings" size={17} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Configurações</span>}
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="flex items-center gap-2.5 w-full rounded-lg text-[13.5px] font-medium transition-colors"
          style={{
            padding: collapsed && !isMobile ? '10px 0' : '9px 12px',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            color: 'var(--danger)',
          }}
          title={collapsed ? 'Sair' : undefined}
        >
          <DesignerIcon name="logout" size={17} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

function Topbar({ onMenuClick, navItems }: { onMenuClick: () => void; navItems: typeof navItemsBase }) {
  const pathname = usePathname()
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('karisCurrentUser')
      if (raw) {
        const parsed = JSON.parse(raw)
        setUserName(parsed.name ?? '')
        setUserRole(parsed.role ?? '')
      }
    } catch { /* noop */ }
  }, [])

  function isActiveItem(item: (typeof navItemsBase)[number]) {
    const paths = item.activePaths?.length ? item.activePaths : [item.href]
    return paths.some(p => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  }

  const title = navItems.find(isActiveItem)?.label ?? 'Karis Atende'

  return (
    <header
      className="flex items-center gap-4 px-5"
      style={{
        height: 'calc(60px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Alternar menu"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <DesignerIcon name="menu" size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold tracking-tight truncate" style={{ color: 'var(--text)' }}>{title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>Operação</div>
      </div>

      <div
        className="hidden md:flex items-center gap-2 rounded-lg px-3"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', height: 36, width: 220 }}
      >
        <span style={{ color: 'var(--subtle)' }}>
          <DesignerIcon name="search" size={15} className="flex-shrink-0" />
        </span>
        <input
          placeholder="Buscar…"
          aria-label="Buscar"
          className="text-[13px] outline-none bg-transparent w-full"
          style={{ color: 'var(--text)' }}
        />
      </div>

      <button
        type="button"
        aria-label="Notificações"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <DesignerIcon name="bell" size={18} />
      </button>

      {userName && (
        <button
          type="button"
          aria-label="Conta"
          className="h-10 inline-flex items-center gap-2 rounded-full pl-1 pr-2 transition-colors"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
        >
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-3)' }}
            aria-hidden="true"
          >
            <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              {userName.split(' ')[0]}
            </span>
            {userRole ? (
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {userRole === 'ADMIN' ? 'Admin' : userRole === 'AGENT' ? 'Agente' : userRole}
              </span>
            ) : null}
          </div>
          <DesignerIcon name="chevronDown" size={16} />
        </button>
      )}
    </header>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)

  useEffect(() => {
    let alive = true
    api.getMyCompany()
      .then(res => {
        if (!alive) return
        setEntitlements(res.company.entitlements)
      })
      .catch(() => { /* noop */ })

    return () => { alive = false }
  }, [])

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mql.matches)
    update()
    if ('addEventListener' in mql) mql.addEventListener('change', update)
    else (mql as any).addListener(update)
    return () => {
      if ('removeEventListener' in mql) mql.removeEventListener('change', update)
      else (mql as any).removeListener(update)
    }
  }, [])

  useEffect(() => {
    if (!isMobile) return
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isMobile, mobileOpen])

  const navItems = useMemo(() => {
    if (!entitlements) return navItemsBase
    return navItemsBase.filter(item => {
      if (!item.requires) return true
      if (item.requires === 'ai') return entitlements.ai
      if (item.requires === 'whatsapp') return entitlements.whatsapp
      if (item.requires === 'karisLink') return entitlements.karisLink
      return true
    }).filter(item => {
      if (!item.requiresModule) return true
      return Boolean((entitlements.modules as any)?.[item.requiresModule])
    })
  }, [entitlements])

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl"
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        Pular para o conteúdo
      </a>
      {isMobile ? (
        <>
          {mobileOpen ? (
            <button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0"
              style={{ background: 'rgba(0,0,0,.42)', zIndex: 40 }}
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
          <div
            className="fixed left-0 top-0 h-[100dvh] transition-transform duration-200"
            style={{
              zIndex: 50,
              transform: mobileOpen ? 'translateX(0)' : 'translateX(-105%)',
              boxShadow: mobileOpen ? '0 18px 60px rgba(0,0,0,.28)' : 'none',
            }}
          >
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(o => !o)} navItems={navItems} />
          </div>
        </>
      ) : (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} navItems={navItems} />
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => (isMobile ? setMobileOpen(o => !o) : setCollapsed(c => !c))} navItems={navItems} />
        <main id="main-content" tabIndex={-1} aria-label="Conteúdo principal" className="flex-1 overflow-y-auto p-4 md:p-6 screen-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
