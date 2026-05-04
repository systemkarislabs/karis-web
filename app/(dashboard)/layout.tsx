'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, LayoutDashboard, LogOut, Menu, MessagesSquare, Phone, Search, Users } from 'lucide-react'
import { api } from '@/lib/api'
import type { Entitlements } from '@/lib/types'

type NavRequirement = 'ai' | 'whatsapp' | 'karisLink'

const navItemsBase: Array<{
  href: string
  label: string
  icon: React.ReactNode
  requires?: NavRequirement
  requiresModule?: string
}> = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} aria-hidden="true" />,
  },
  {
    href: '/conversas',
    label: 'Conversas',
    icon: <MessagesSquare size={18} aria-hidden="true" />,
  },
  {
    href: '/multi-chat',
    label: 'Multi-chat',
    icon: <MessagesSquare size={18} aria-hidden="true" />,
  },
  {
    href: '/assistente',
    label: 'Assistente',
    requires: 'ai',
    icon: <Bot size={18} aria-hidden="true" />,
  },
  {
    href: '/contatos',
    label: 'Contatos',
    icon: <Users size={18} aria-hidden="true" />,
  },
  {
    href: '/whatsapp',
    label: 'WhatsApp',
    requires: 'whatsapp',
    icon: <Phone size={18} aria-hidden="true" />,
  },
]

function Sidebar({ collapsed, onToggle, navItems }: { collapsed: boolean; onToggle: () => void; navItems: typeof navItemsBase }) {
  const pathname = usePathname()
  const router = useRouter()

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
        width: collapsed ? 64 : 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4" style={{ height: 60, borderBottom: '1px solid var(--border)' }}>
        <img src="/designer/logo.svg" alt="" className="w-8 h-8 object-contain flex-shrink-0" />
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--text)' }}>
            Karis Atende
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const activeBg = 'color-mix(in oklch, var(--primary) 8%, transparent)'
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="flex items-center gap-2.5 w-full rounded-lg text-[13.5px] font-medium transition-colors"
              style={{
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                background: active ? activeBg : 'transparent',
                color: active ? 'var(--primary)' : 'var(--muted)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0" style={{ color: active ? 'var(--primary)' : 'var(--muted)' }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
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
            padding: collapsed ? '10px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--muted)',
          }}
        >
          <Menu size={17} aria-hidden="true" className="flex-shrink-0" />
          {!collapsed && <span>Menu</span>}
        </button>
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="flex items-center gap-2.5 w-full rounded-lg text-[13.5px] font-medium transition-colors"
          style={{
            padding: collapsed ? '10px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--danger)',
          }}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={17} aria-hidden="true" className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

function Topbar({ onMenuClick, navItems }: { onMenuClick: () => void; navItems: typeof navItemsBase }) {
  const pathname = usePathname()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('karisCurrentUser')
      if (raw) setUserName(JSON.parse(raw).name ?? '')
    } catch { /* noop */ }
  }, [])

  const title = navItems.find(item =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )?.label ?? 'Karis Atende'

  return (
    <header
      className="flex items-center gap-4 px-5"
      style={{
        height: 60,
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
        <Menu size={18} aria-hidden="true" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold tracking-tight truncate" style={{ color: 'var(--text)' }}>{title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>Operação</div>
      </div>

      <div
        className="hidden md:flex items-center gap-2 rounded-lg px-3"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', height: 36, width: 220 }}
      >
        <Search size={15} aria-hidden="true" style={{ color: 'var(--subtle)' }} />
        <input
          placeholder="Buscar…"
          aria-label="Buscar"
          className="text-[13px] outline-none bg-transparent w-full"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {userName && (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-3)' }}
            aria-hidden="true"
          >
            <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="text-[13px] font-semibold hidden sm:block" style={{ color: 'var(--text)' }}>
            {userName.split(' ')[0]}
          </span>
        </div>
      )}
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl"
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        Pular para o conteúdo
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} navItems={navItems} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setCollapsed(c => !c)} navItems={navItems} />
        <main id="main-content" tabIndex={-1} aria-label="Conteúdo principal" className="flex-1 overflow-y-auto p-6 screen-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
