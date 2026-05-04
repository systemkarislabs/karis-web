'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, LayoutDashboard, LogOut, Menu, MessagesSquare, Phone, Users } from 'lucide-react'
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
        borderRight: '1px solid var(--border-soft)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5" style={{ minHeight: 64 }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-600))' }}
        >
          <MessagesSquare size={16} aria-hidden="true" color="white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
            Karis Atende
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
              style={{
                color: active ? 'var(--teal)' : 'var(--muted)',
                background: active ? 'var(--teal-soft)' : 'transparent',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0" style={{ color: active ? 'var(--teal)' : 'var(--muted)' }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 flex flex-col gap-0.5">
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors hover:bg-red-50"
          style={{ color: 'var(--danger)' }}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={18} aria-hidden="true" className="flex-shrink-0" />
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
        height: 64,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-soft)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Alternar menu"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        style={{ color: 'var(--muted)' }}
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      <h1 className="text-base font-semibold flex-1" style={{ color: 'var(--text)' }}>{title}</h1>

      {userName && (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text)' }}>
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
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-card)' }}
      >
        Pular para o conteúdo
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} navItems={navItems} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setCollapsed(c => !c)} navItems={navItems} />
        <main id="main-content" tabIndex={-1} aria-label="Conteúdo principal" className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
