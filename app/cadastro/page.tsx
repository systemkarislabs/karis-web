'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api.register(form)
      localStorage.setItem('karisAuthToken', token)
      localStorage.setItem('karisCurrentUser', JSON.stringify(user))
      await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all'
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }

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
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Criar conta</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Comece gratuitamente hoje mesmo</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Seu nome</label>
              <input
                type="text" value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="João Silva"
                className={inputClass} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nome da empresa</label>
              <input
                type="text" value={form.companyName} onChange={e => set('companyName', e.target.value)} required
                placeholder="Minha Empresa"
                className={inputClass} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>E-mail</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                placeholder="seu@email.com"
                className={inputClass} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Senha</label>
              <input
                type="password" value={form.password} onChange={e => set('password', e.target.value)} required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className={inputClass} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
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
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Já tem conta?{' '}
          <a href="/login" style={{ color: 'var(--teal)' }} className="font-medium hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  )
}
