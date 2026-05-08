'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BadgeCheck, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'

function Spinner() {
  return (
    <svg className="animate-spin" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', position: 'relative', overflow: 'hidden', background: '#040E1F' }}>

      {/* ── Background orbs ────────────────────────────────── */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        {/* Teal orb top-left */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-8%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(103,152,148,.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        {/* Navy-blue orb center */}
        <div style={{
          position: 'absolute', top: '30%', left: '25%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,32,64,.55) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        {/* Teal orb bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-10%', right: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(103,152,148,.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
      </div>

      {/* ── Main grid ─────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid',
        width: '100%',
        gridTemplateColumns: '1fr clamp(0px,44%,520px)',
      }}>

        {/* ── LEFT: brand panel ─────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col justify-between"
          style={{ padding: '56px 64px 48px', color: '#fff', order: 1 }}
          aria-label="Apresentação Karis Atende"
        >
          <div>
            {/* Logo */}
            <img
              src="/designer/karis-k-mark.png"
              alt="Karis Atende"
              style={{
                height: 48,
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: 0.96,
              }}
            />

            {/* Hero copy */}
            <div style={{ marginTop: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#679894', textTransform: 'uppercase', marginBottom: 14 }}>
                Plataforma de Atendimento IA
              </p>
              <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.18, letterSpacing: '-0.8px', color: '#FFFFFF', maxWidth: 400, margin: 0 }}>
                Conecta.{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #8BBFBB, #679894)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Atende.
                </span>{' '}
                Resolve.
              </h1>
              <p style={{ marginTop: 18, fontSize: 15, color: 'rgba(200,218,215,.68)', lineHeight: 1.65, maxWidth: 360 }}>
                IA treinada no seu negócio, WhatsApp integrado e métricas em tempo real.
              </p>
            </div>

            {/* Floating metric badges */}
            <div style={{ marginTop: 52, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { value: '98%', label: 'Satisfação' },
                { value: '< 2 min', label: 'Tempo de resposta' },
                { value: '3×', label: 'Mais conversões' },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.09)',
                  backdropFilter: 'blur(12px)',
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#8BBFBB', letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(180,205,202,.6)', marginTop: 4, fontWeight: 500 }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Agentes de IA treinados com seus produtos',
                'WhatsApp, Instagram e Telegram unificados',
                'Pausa, múltiplos atendentes e CRM integrado',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(103,152,148,.15)',
                    border: '1px solid rgba(103,152,148,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg viewBox="0 0 10 10" fill="none" style={{ width: 9, height: 9 }} aria-hidden="true">
                      <path d="M2 5.2l2 2 4-4" stroke="#679894" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 13.5, color: 'rgba(215,230,228,.8)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div>
            <p style={{ fontSize: 11.5, color: 'rgba(140,170,166,.4)' }}>
              © {new Date().getFullYear()} Karis Atende · Karis Negócios
            </p>
          </div>
        </aside>

        {/* ── RIGHT: form panel ─────────────────────────── */}
        <main
          className="flex flex-col items-center justify-center"
          style={{
            order: 2,
            minHeight: '100dvh',
            padding: '40px 32px',
            background: 'rgba(255,255,255,.97)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <div style={{ width: '100%', maxWidth: 360 }}>

            {/* Logo principal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 38 }}>
              <img
                src="/designer/karis-atende-logo-clean.png"
                alt="Karis Atende"
                style={{ height: 58, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
              />
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 30, textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: '#0F172A', margin: 0 }}>
                Bem-vindo de volta
              </h2>
              <p style={{ fontSize: 13.5, color: '#94A3B8', marginTop: 6 }}>
                Entre na sua conta para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="login-email" style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  style={{
                    height: 46, padding: '0 14px', borderRadius: 10,
                    border: '1.5px solid #E2E8F0', fontSize: 14,
                    color: '#0F172A', background: '#FAFBFC', outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#679894'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103,152,148,.13)'
                    e.currentTarget.style.background = '#FFFFFF'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.background = '#FAFBFC'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                    Senha
                  </label>
                  <Link href="/recuperar-senha" style={{ fontSize: 12.5, fontWeight: 600, color: '#679894', textDecoration: 'none' }}>
                    Esqueci a senha
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%', height: 46, padding: '0 44px 0 14px',
                      borderRadius: 10, border: '1.5px solid #E2E8F0',
                      fontSize: 14, color: '#0F172A', background: '#FAFBFC',
                      outline: 'none', transition: 'border-color .15s, box-shadow .15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#679894'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103,152,148,.13)'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#E2E8F0'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.background = '#FAFBFC'
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPwd(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94A3B8', display: 'flex', padding: 4,
                    }}
                  >
                    {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" style={{
                  fontSize: 13, padding: '10px 14px', borderRadius: 10,
                  background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6, width: '100%', height: 48, borderRadius: 12,
                  background: loading ? '#0F2040' : 'linear-gradient(135deg, #0F2040 0%, #1C3D6B 100%)',
                  color: '#FFFFFF', fontSize: 14.5, fontWeight: 700, letterSpacing: '0.2px',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.8 : 1,
                  boxShadow: loading ? 'none' : '0 4px 18px rgba(15,32,64,.28)',
                  transition: 'opacity .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,32,64,.35)' } }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(15,32,64,.28)' }}
              >
                {loading && <Spinner />}
                {loading ? 'Entrando…' : 'Entrar na plataforma'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 22 }}>
              Não tem conta?{' '}
              <Link href="/cadastro" style={{ color: '#679894', fontWeight: 700, textDecoration: 'none' }}>
                Fale com nosso time
              </Link>
            </p>

            {/* Trust badges */}
            <div style={{ marginTop: 42, paddingTop: 26, borderTop: '1px solid #E8EEF5', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {[
                { Icon: LockKeyhole, label: 'Conexão segura' },
                { Icon: ShieldCheck, label: 'Dados protegidos' },
                { Icon: BadgeCheck, label: 'LGPD' },
              ].map(({ Icon, label }) => (
                <div key={label} style={{
                  minHeight: 54,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}>
                  <Icon size={16} aria-hidden="true" style={{ color: '#679894' }} />
                  <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
