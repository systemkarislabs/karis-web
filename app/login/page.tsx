'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { BarChart3, Bot, MessageSquareText } from 'lucide-react'
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
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--bg)' }}>
      <aside
        className="hidden lg:flex flex-col justify-between px-14 py-12"
        style={{
          background: 'radial-gradient(1200px 800px at 20% 10%, rgba(103,152,148,.20), transparent 55%), linear-gradient(135deg, #0A0C10, #111827)',
          color: 'rgba(255,255,255,.92)',
        }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
              <img src="/designer/logo.svg" alt="" className="w-9 h-9 object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold tracking-tight">Karis Atende</div>
              <div className="text-sm mt-1" style={{ color: 'rgba(203,213,225,.9)' }}>Plataforma de atendimento inteligente com IA</div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-6">
            {[
              { icon: <Bot size={18} aria-hidden="true" />, text: 'Agentes de IA treinados para o seu negócio' },
              { icon: <MessageSquareText size={18} aria-hidden="true" />, text: 'Multi-canal: WhatsApp, Instagram, Telegram' },
              { icon: <BarChart3 size={18} aria-hidden="true" />, text: 'Dashboard com métricas em tempo real' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}
                >
                  {item.icon}
                </div>
                <div className="text-sm" style={{ color: 'rgba(226,232,240,.92)' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'rgba(148,163,184,.75)' }}>
          © Karis Atende · Todos os direitos reservados a Karis Negócios
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <img src="/designer/logo.svg" alt="" className="w-9 h-9 object-contain" />
            <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Karis Atende</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Bem-vindo de volta</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Entre na sua conta para continuar</p>
          </div>

          <Card className="p-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-sm font-medium" style={{ color: 'var(--text)' }}>E-mail</label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="voce@empresa.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Senha</label>
                  <button type="button" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                    Esqueci a senha
                  </button>
                </div>
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
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'oklch(97% 0.04 15)', color: 'var(--danger)', border: '1px solid color-mix(in oklch, var(--danger) 22%, transparent)' }}>{error}</p>
              )}

              <Button type="submit" variant="primary" loading={loading} className="w-full h-11 rounded-[12px]">
                Entrar
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
            Não tem conta?{' '}
            <Link href="/cadastro" style={{ color: 'var(--primary)' }} className="font-semibold hover:underline">
              Fale com nosso time
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
