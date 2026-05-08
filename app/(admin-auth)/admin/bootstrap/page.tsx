'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function AdminBootstrapPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bootstrapSecret, setBootstrapSecret] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.adminBootstrap(email.trim(), password, bootstrapSecret)
      localStorage.setItem('karisAdminToken', res.token)
      localStorage.setItem('karisAdminUser', JSON.stringify(res.platformUser))
      toast('Superadmin criado', 'success')
      router.push('/admin')
    } catch (err: any) {
      toast(err.message || 'Falha no bootstrap', 'error')
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
        <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Criar superadmin</div>
        <div className="mt-1 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>
          Use o segredo configurado no backend (ADMIN_BOOTSTRAP_SECRET).
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <div className="text-xs font-semibold" style={{ color: 'rgba(155,178,209,.92)' }}>Bootstrap secret</div>
            <input
              value={bootstrapSecret}
              onChange={e => setBootstrapSecret(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', color: 'rgba(255,255,255,.92)' }}
              type="password"
              autoComplete="off"
            />
          </div>
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
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(59,130,246,.22)', border: '1px solid rgba(59,130,246,.30)', color: 'rgba(255,255,255,.92)' }}
            disabled={loading || !bootstrapSecret.trim()}
          >
            {loading ? 'Criando…' : 'Criar'}
          </button>
        </form>

        <div className="mt-4 text-xs" style={{ color: 'rgba(155,178,209,.92)' }}>
          Já tem admin? <Link href="/admin/login" className="font-semibold" style={{ color: 'rgba(255,255,255,.92)' }}>Entrar</Link>
        </div>
      </div>
    </div>
  )
}
