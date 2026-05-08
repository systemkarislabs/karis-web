'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modern-page min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="brand-logo-auth">
            <img src="/designer/karis-atende-logo-clean.png" alt="Karis Atende" />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Recuperar senha</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Informe seu e-mail para receber o link de redefinição.
          </p>
        </div>

        <Card className="auth-modern-card p-7">
          {sent ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Se o e-mail existir, enviamos um link para redefinir a senha.
              </p>
              <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="recover-email" className="text-sm font-medium" style={{ color: 'var(--text)' }}>E-mail</label>
                <Input
                  id="recover-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="voce@empresa.com"
                />
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'oklch(97% 0.04 15)', color: 'var(--danger)', border: '1px solid color-mix(in oklch, var(--danger) 22%, transparent)' }}>{error}</p>
              )}

              <Button type="submit" variant="primary" loading={loading} className="w-full h-11 rounded-[12px]">
                Enviar link
              </Button>

              <Link href="/login" className="text-sm font-semibold text-center hover:underline" style={{ color: 'var(--primary)' }}>
                Voltar
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
