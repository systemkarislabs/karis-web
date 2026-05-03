'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api.login(email, password)
      localStorage.setItem('karisAuthToken', token)
      localStorage.setItem('karisCurrentUser', JSON.stringify(user))
      // salva cookie para o middleware
      await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Karis Atende</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Entrar</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: 'var(--danger)' }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Sem conta?{' '}
          <a href="/cadastro" style={{ color: 'var(--teal)' }} className="font-medium hover:underline">Criar conta</a>
        </p>
      </div>
    </div>
  )
}
