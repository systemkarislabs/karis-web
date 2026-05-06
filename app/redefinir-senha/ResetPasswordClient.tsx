'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordClient() {
  const router = useRouter()
  const params = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Token ausente. Abra o link do e-mail novamente.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <img src="/designer/logo.svg" alt="" className="w-9 h-9 object-contain" />
          <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Karis Atende</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Redefinir senha</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Crie uma nova senha para entrar na sua conta.
          </p>
        </div>

        <Card className="p-7">
          {done ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: 'var(--text)' }}>Senha redefinida com sucesso. Redirecionando para o login…</p>
              <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nova senha</label>
                <Input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-password-confirm" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Confirmar senha</label>
                <Input
                  id="reset-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'oklch(97% 0.04 15)', color: 'var(--danger)', border: '1px solid color-mix(in oklch, var(--danger) 22%, transparent)' }}>{error}</p>
              )}

              <Button type="submit" variant="primary" loading={loading} className="w-full h-11 rounded-[12px]">
                Salvar nova senha
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

