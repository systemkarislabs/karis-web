'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BadgeCheck, Building2, LayoutGrid, LogOut, Menu } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Visão geral', icon: LayoutGrid },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/admin/planos', label: 'Planos', icon: BadgeCheck },
]

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    localStorage.removeItem('karisAdminToken')
    localStorage.removeItem('karisAdminUser')
    router.push('/admin/login')
  }

  return (
    <aside
      className="flex flex-col h-full transition-all duration-200"
      style={{
        width: collapsed ? 68 : 252,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-soft)',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-3 px-5 py-5" style={{ minHeight: 72 }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg,var(--accent), #1D4ED8)',
            boxShadow: '0 10px 30px rgba(59,130,246,.25)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l9 4-9 4-9-4 9-4z" />
            <path d="M3 10l9 4 9-4" />
            <path d="M3 18l9 4 9-4" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>Karis Atende</div>
            <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Admin</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(item => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                color: active ? 'var(--accent)' : 'var(--muted)',
                background: active ? 'rgba(59,130,246,.14)' : 'transparent',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0" style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
                <item.icon size={18} aria-hidden="true" />
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={logout}
          aria-label="Sair"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full transition-colors"
          style={{
            color: 'rgba(255,255,255,.85)',
            background: 'rgba(239,68,68,.16)',
            border: '1px solid rgba(239,68,68,.22)',
          }}
        >
          <LogOut size={18} aria-hidden="true" className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const title = useMemo(() => {
    const item = navItems.find(i => (i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)))
    return item?.label ?? 'Admin'
  }, [pathname])

  const [email, setEmail] = useState<string>('')
  useEffect(() => {
    try {
      const raw = localStorage.getItem('karisAdminUser')
      if (raw) setEmail(JSON.parse(raw).email ?? '')
    } catch {}
  }, [])

  return (
    <header
      className="flex items-center gap-4 px-6"
      style={{
        height: 72,
        background: 'linear-gradient(180deg, rgba(13,18,32,1), rgba(13,18,32,.86))',
        borderBottom: '1px solid var(--border-soft)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Alternar menu"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--muted)', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>{title}</div>
        <div className="text-xs" style={{ color: 'rgba(155,178,209,.9)' }}>Plataforma</div>
      </div>

      {email && (
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,.18), rgba(59,130,246,.06))',
              border: '1px solid rgba(59,130,246,.28)',
              color: 'rgba(255,255,255,.92)',
            }}
          >
            {email.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,.9)' }}>Admin</span>
            <span className="text-xs" style={{ color: 'rgba(155,178,209,.9)' }}>{email}</span>
          </div>
        </div>
      )}
    </header>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('karisAdminToken')
    if (!token) router.replace('/admin/login')
  }, [router, pathname])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={
        {
          background: 'var(--bg)',
          ['--bg' as any]: '#070A12',
          ['--surface' as any]: '#0D1220',
          ['--border-soft' as any]: 'rgba(255,255,255,.06)',
          ['--text' as any]: 'rgba(255,255,255,.92)',
          ['--muted' as any]: 'rgba(155,178,209,.92)',
          ['--accent' as any]: '#3B82F6',
        } as React.CSSProperties
      }
    >
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl"
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-soft)', boxShadow: '0 12px 30px rgba(0,0,0,.35)' }}
      >
        Pular para o conteúdo
      </a>
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setCollapsed(c => !c)} />
        <main id="admin-main-content" tabIndex={-1} aria-label="Conteúdo principal" className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
