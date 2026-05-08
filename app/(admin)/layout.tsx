'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BadgeCheck, Building2, ChevronDown, LayoutGrid, LogOut, Menu } from 'lucide-react'

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
      className="app-sidebar flex flex-col h-full transition-all duration-200"
      style={{
        width: collapsed ? 68 : 252,
        borderRight: '1px solid var(--border-soft)',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-3 px-5 py-5" style={{ minHeight: 72 }}>
        {collapsed ? (
          <span className="brand-k-mark !w-10 !h-10 flex-shrink-0" aria-hidden="true">
            <img src="/designer/karis-k-mark.png" alt="" />
          </span>
        ) : (
          <div className="min-w-0 flex items-center gap-2">
            <span className="brand-k-mark !w-8 !h-8" aria-hidden="true">
              <img src="/designer/karis-k-mark.png" alt="" />
            </span>
            <div>
              <div className="brand-wordmark leading-tight">Karis Atende</div>
            <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Admin</div>
            </div>
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
              className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-semibold transition-colors ${active ? 'nav-item-active' : ''}`}
              style={{
                color: active ? 'var(--navy)' : 'var(--muted)',
                background: active ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'transparent',
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
            color: 'var(--danger)',
            background: 'rgba(190,54,72,.08)',
            border: '1px solid rgba(190,54,72,.18)',
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
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function logout() {
    setOpen(false)
    localStorage.removeItem('karisAdminToken')
    localStorage.removeItem('karisAdminUser')
    router.push('/admin/login')
  }

  return (
    <header
      className="app-topbar flex items-center gap-4 px-6"
      style={{
        height: 72,
        borderBottom: '1px solid var(--border-soft)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Alternar menu"
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--muted)', background: 'rgba(6,30,68,.04)', border: '1px solid var(--border-soft)' }}
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>Plataforma</div>
      </div>

      {email && (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu do administrador"
            aria-expanded={open}
            className="h-10 inline-flex items-center gap-2 rounded-full pl-1 pr-3 transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--teal-soft)', border: '1px solid var(--border-soft)', color: 'var(--primary)' }}
            >
              {email.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold">Admin</span>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{email}</span>
            </span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
              style={{ width: 220, background: 'var(--surface)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Administrador</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={15} aria-hidden="true" />
                Sair
              </button>
            </div>
          )}
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
      className="admin-skin karis-design-stage"
      style={
        {
          background: 'var(--bg)',
          ['--bg' as any]: '#F4F5F1',
          ['--surface' as any]: '#FFFFFF',
          ['--border-soft' as any]: '#E9EDE6',
          ['--text' as any]: '#121816',
          ['--muted' as any]: '#63706D',
          ['--accent' as any]: '#5A928E',
        } as React.CSSProperties
      }
    >
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl"
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-card)' }}
      >
        Pular para o conteúdo
      </a>
      <div className="karis-app-frame">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setCollapsed(c => !c)} />
        <main id="admin-main-content" tabIndex={-1} aria-label="Conteúdo principal" className="admin-main-content flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      </div>
    </div>
  )
}
