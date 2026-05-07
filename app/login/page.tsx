'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Bot, MessageSquareText } from 'lucide-react'
import { api } from '@/lib/api'
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
      await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(420px,0.92fr)_1.08fr]" style={{ background: 'var(--bg)' }}>
      <aside
        className="hidden lg:flex flex-col justify-between px-14 py-12"
        style={{
          background: 'radial-gradient(900px 620px at 18% 8%, rgba(90,146,142,.28), transparent 58%), radial-gradient(720px 540px at 90% 84%, rgba(184,135,84,.18), transparent 55%), linear-gradient(145deg, #061E44, #09131E 58%, #121816)',
          color: 'rgba(255,255,255,.92)',
        }}
      >
        <div>
          <div>
            <div className="brand-logo-side rounded-[14px] bg-white/95 p-3">
              <img src="/designer/karis-atende-logo-clean.png" alt="Karis Atende" />
            </div>
            <div className="text-sm mt-4" style={{ color: 'rgba(225,232,229,.82)' }}>
              Atendimento inteligente, operação clara e IA treinada para vender melhor.
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-6">
            {[
              { icon: <Bot size={18} aria-hidden="true" />, text: 'Agentes de IA treinados para o seu negócio' },
              { icon: <MessageSquareText size={18} aria-hidden="true" />, text: 'WhatsApp, Instagram e Telegram em uma rotina só' },
              { icon: <BarChart3 size={18} aria-hidden="true" />, text: 'Métricas limpas para decidir rápido' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: 'var(--champagne)' }}
                >
                  {item.icon}
                </div>
                <div className="text-sm" style={{ color: 'rgba(235,239,237,.90)' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'rgba(225,232,229,.58)' }}>
          © Karis Atende · Karis Negócios
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-7">
            <div className="brand-logo-auth">
              <img src="/designer/karis-atende-logo-clean.png" alt="Karis Atende" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Bem-vindo de volta</h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>Entre na sua conta para continuar</p>
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
                  <Link href="/recuperar-senha" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    Esqueci a senha
                  </Link>
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
                <p className="text-sm px-3 py-2 rounded-[12px]" style={{ background: 'oklch(97% 0.04 15)', color: 'var(--danger)', border: '1px solid color-mix(in oklch, var(--danger) 22%, transparent)' }}>{error}</p>
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
