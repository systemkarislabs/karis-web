'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { BarChart3, Bot, MessageSquareText } from 'lucide-react'
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
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--bg)' }}>
      <aside
        className="hidden lg:flex flex-col justify-between px-14 py-12"
        style={{
          background: 'radial-gradient(1200px 800px at 20% 10%, rgba(103,152,148,.20), transparent 55%), linear-gradient(135deg, #0A0C10, #111827)',
          color: 'rgba(255,255,255,.92)',
        }}
      >
        <div>
          <div>
            <div className="brand-logo-side rounded-xl bg-white">
              <img src="/designer/karis-atende-logo-clean.png" alt="Karis Atende" />
            </div>
            <div className="text-sm mt-3" style={{ color: 'rgba(203,213,225,.9)' }}>Plataforma de atendimento inteligente com IA</div>
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
          <div className="lg:hidden mb-6">
            <div className="brand-logo-auth">
              <img src="/designer/karis-atende-logo-clean.png" alt="Karis Atende" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Criar conta</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Comece agora e configure seu atendimento</p>
          </div>

          <Card className="p-7">
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
                <Input id="signup-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="voce@empresa.com" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Senha</label>
                <Input id="signup-password" type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} />
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'oklch(97% 0.04 15)', color: 'var(--danger)', border: '1px solid color-mix(in oklch, var(--danger) 22%, transparent)' }}>{error}</p>
              )}

              <Button type="submit" variant="primary" loading={loading} className="w-full h-11 rounded-[12px]">
                Criar conta
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--primary)' }} className="font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
