'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.adminLogin(email.trim(), password)
      localStorage.setItem('karisAdminToken', res.token)
      localStorage.setItem('karisAdminUser', JSON.stringify(res.platformUser))
      toast('Bem-vindo', 'success')
      router.push('/admin')
    } catch (err: any) {
      toast(err.message || 'Falha no login', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modern-page min-h-screen flex items-center justify-center p-6" style={{ background: '#070A12' }}>
      <div
        className="auth-modern-card w-full max-w-md rounded-3xl p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(13,18,32,1), rgba(13,18,32,.74))',
          border: '1px solid rgba(255,255,255,.08)',
          boxShadow: '0 30px 90px rgba(0,0,0,.45)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l9 4-9 4-9-4 9-4z" />
              <path d="M3 10l9 4 9-4" />
              <path d="M3 18l9 4 9-4" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Karis Atende</div>
            <div className="text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>Admin</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Entrar</div>
          <div className="mt-1 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>Acesso exclusivo do superadmin</div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>E-mail</div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', color: 'rgba(255,255,255,.92)' }}
              autoComplete="email"
            />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>Senha</div>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', color: 'rgba(255,255,255,.92)' }}
              type="password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(59,130,246,.22)', border: '1px solid rgba(59,130,246,.30)', color: 'rgba(255,255,255,.92)' }}
            disabled={loading}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>
          Primeiro acesso? <Link href="/admin/bootstrap" className="font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Criar superadmin</Link>
        </div>
      </div>
    </div>
  )
}
