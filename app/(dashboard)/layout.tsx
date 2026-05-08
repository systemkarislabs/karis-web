'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
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
    activePaths: ['/ia', '/assistente', '/conhecimento', '/treinamento'],
    requires: 'ai',
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
    href: '/calendario',
    label: 'Calend\u00e1rio',
    icon: <DesignerIcon name="calendar" size={18} />,
  },
  {
    href: '/remuneracao',
    label: 'Remunera\u00e7\u00e3o',
    icon: <DesignerIcon name="payment" size={18} />,
  },
]

function KarisLogo({ collapsed, isMobile }: { collapsed: boolean; isMobile: boolean }) {
  const showFull = !collapsed || isMobile
  return (
    <div className="flex items-center min-w-0">
      {showFull ? (
        <img
          src="/designer/karis-atende-logo-clean.png"
          alt="Karis Atende"
          style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
      ) : (
        <img
          src="/designer/karis-k-mark.png"
          alt="Karis"
          style={{ height: 36, width: 36, objectFit: 'contain', flexShrink: 0 }}
        />
      )}
    </div>
  )
}

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
      className="app-sidebar flex flex-col h-full transition-all duration-200"
      style={{
        width: isMobile ? 280 : 48,
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center gap-2.5"
        style={{
          height: 'calc(64px + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <KarisLogo collapsed={!isMobile} isMobile={isMobile} />

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
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActiveItem(item)
          const activeBg = 'rgba(90,152,148,.12)'
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`nav-item flex items-center gap-2.5 w-full rounded-[8px] text-[13.5px] font-semibold transition-colors ${active ? 'nav-item-active' : ''}`}
              style={{
                minHeight: 36,
                padding: isMobile ? '9px 12px' : '0',
                justifyContent: isMobile ? 'flex-start' : 'center',
                background: active ? activeBg : 'transparent',
                color: active ? 'var(--navy)' : 'var(--muted)',
              }}
              title={!isMobile ? item.label : undefined}
              onClick={() => { if (isMobile) onToggle() }}
            >
              <span className="flex-shrink-0" style={{ color: active ? 'var(--navy)' : 'inherit' }}>
                {item.icon}
              </span>
              {isMobile && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="nav-item flex items-center gap-2.5 w-full rounded-[8px] text-[13.5px] font-semibold transition-colors"
          style={{
            minHeight: 36,
            padding: isMobile ? '9px 12px' : '0',
            justifyContent: isMobile ? 'flex-start' : 'center',
            color: 'var(--muted)',
          }}
        >
          <DesignerIcon name="menu" size={17} className="flex-shrink-0" />
          {isMobile && <span>Menu</span>}
        </button>
        <Link
          href="/configuracoes"
          aria-label={'Configura\u00e7\u00f5es'}
          className="nav-item flex items-center gap-2.5 w-full rounded-[8px] text-[13.5px] font-semibold transition-colors"
          style={{
            minHeight: 36,
            padding: isMobile ? '9px 12px' : '0',
            justifyContent: isMobile ? 'flex-start' : 'center',
            color: 'var(--muted)',
          }}
          title={!isMobile ? 'Configura\u00e7\u00f5es' : undefined}
          onClick={() => { if (isMobile) onToggle() }}
        >
          <DesignerIcon name="settings" size={17} className="flex-shrink-0" />
          {isMobile && <span>{'Configura\u00e7\u00f5es'}</span>}
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="nav-item flex items-center gap-2.5 w-full rounded-[8px] text-[13.5px] font-semibold transition-colors"
          style={{
            minHeight: 36,
            padding: isMobile ? '9px 12px' : '0',
            justifyContent: isMobile ? 'flex-start' : 'center',
            color: 'var(--danger)',
          }}
          title={!isMobile ? 'Sair' : undefined}
        >
          <DesignerIcon name="logout" size={17} className="flex-shrink-0" />
          {isMobile && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

function UserMenu({ userName, userRole }: { userName: string; userRole: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    localStorage.removeItem('karisAuthToken')
    localStorage.removeItem('karisCurrentUser')
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  const initial = userName.charAt(0).toUpperCase()
  const displayName = userName.split(' ')[0]
  const roleLabel = userRole === 'ADMIN' ? 'Admin' : userRole === 'AGENT' ? 'Agente' : userRole

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu do usuário"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="h-10 inline-flex items-center gap-2 rounded-full pl-1 pr-2 transition-colors"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
      >
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-3)' }}
          aria-hidden="true"
        >
          <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: 'var(--primary)' }}>
            {initial}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{displayName}</span>
          {roleLabel ? (
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{roleLabel}</span>
          ) : null}
        </div>
        <DesignerIcon name="chevronDown" size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
          style={{
            width: 200,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 100,
          }}
        >
          {/* User info header */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{userName}</p>
            {roleLabel ? (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{roleLabel}</p>
            ) : null}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/configuracoes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--bg)]"
              style={{ color: 'var(--text)' }}
            >
              <DesignerIcon name="settings" size={15} />
              {'Configura\u00e7\u00f5es'}
            </Link>
          </div>

          <div className="py-1" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium w-full transition-colors hover:bg-[var(--bg)]"
              style={{ color: 'var(--danger)' }}
            >
              <DesignerIcon name="logout" size={15} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
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

  const activeTopItem = navItems.find(isActiveItem)
  const title = activeTopItem?.label ?? ''
  const topItems = activeTopItem && !navItems.slice(0, 6).some(item => item.href === activeTopItem.href)
    ? [...navItems.slice(0, 5), activeTopItem]
    : navItems.slice(0, 6)

  return (
    <header
      className="app-topbar flex items-center gap-4 px-5"
      style={{
        height: 'calc(60px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Alternar menu"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--muted)' }}
      >
        <DesignerIcon name="menu" size={18} />
      </button>

      <div className="flex-1 min-w-0">
        {title ? (
          <>
            <div className="text-[15px] font-semibold tracking-tight truncate" style={{ color: 'var(--text)' }}>{title}</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{'Opera\u00e7\u00e3o'}</div>
          </>
        ) : (
          <img
            src="/designer/karis-atende-logo-clean.png"
            alt="Karis Atende"
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
          />
        )}
      </div>

      <nav className="hidden xl:flex items-center gap-1 rounded-full px-1 py-1" style={{ background: '#fff', border: '1px solid var(--border-soft)' }} aria-label={'Navega\u00e7\u00e3o principal'}>
        {topItems.map(item => {
          const active = isActiveItem(item)
          return (
            <Link key={item.href} href={item.href} className={`top-pill ${active ? 'top-pill-active' : ''}`}>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div
        className="hidden md:flex items-center gap-2 rounded-lg px-3"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', height: 36, width: 220 }}
      >
        <span style={{ color: 'var(--subtle)' }}>
          <DesignerIcon name="search" size={15} className="flex-shrink-0" />
        </span>
        <input
          placeholder="Buscar..."
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
        <UserMenu userName={userName} userRole={userRole} />
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
    <div data-skin="karis-finance-reference-2026-05-07" className="karis-design-stage">
      <div className="karis-app-frame">
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
        <main id="main-content" tabIndex={-1} aria-label="Conteúdo principal" className="flex-1 overflow-y-auto screen-enter">
          {children}
        </main>
      </div>
      </div>
    </div>
  )
}
