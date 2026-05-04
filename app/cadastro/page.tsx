'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { MessagesSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

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
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Criar conta</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Comece gratuitamente hoje mesmo</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-name" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Seu nome</label>
              <Input id="signup-name" type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="João Silva" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-company" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nome da empresa</label>
              <Input id="signup-company" type="text" value={form.companyName} onChange={e => set('companyName', e.target.value)} required placeholder="Minha Empresa" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-sm font-medium" style={{ color: 'var(--text)' }}>E-mail</label>
              <Input id="signup-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="seu@email.com" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Senha</label>
              <Input id="signup-password" type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: 'var(--danger)' }}>{error}</p>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Criar conta
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--teal)' }} className="font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
