'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { MessagesSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--primary),var(--primary-600))' }}>
            <MessagesSquare size={18} aria-hidden="true" color="white" />
          </div>
          <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Karis Atende</span>
        </div>

        {/* Card */}
        <Card className="p-8">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Entrar</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-medium" style={{ color: 'var(--text)' }}>E-mail</label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Senha</label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: 'var(--danger)' }}>{error}</p>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Sem conta?{' '}
          <Link href="/cadastro" style={{ color: 'var(--teal)' }} className="font-medium hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
