'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'

/* ─── Tiny components ───────────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="animate-spin"
      style={{ width: 18, height: 18, color: 'currentColor' }}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      style={{ width: 15, height: 15, flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7.5" stroke="rgba(103,152,148,.45)" />
      <path d="M5 8.4l2 2 4-4" stroke="#679894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Main page ─────────────────────────────────────────────────── */

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

  const inputBase: React.CSSProperties = {
    width: '100%',
    height: 48,
    padding: '0 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  }

  return (
    <div
      style={{
        display: 'grid',
        minHeight: '100dvh',
        gridTemplateColumns: '1fr clamp(0px, 48%, 540px)',
      }}
    >
      {/* ─── Brand panel (right on desktop) ───────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between"
        style={{
          order: 2,
          padding: '52px 52px 44px',
          background: `
            radial-gradient(ellipse 700px 500px at 10% 0%, rgba(103,152,148,.22) 0%, transparent 55%),
            radial-gradient(ellipse 500px 400px at 95% 100%, rgba(15,32,64,.9) 0%, transparent 60%),
            linear-gradient(160deg, #0A1628 0%, #0F2040 45%, #0D1B30 100%)
          `,
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px),
            radial-gradient(ellipse 700px 500px at 10% 0%, rgba(103,152,148,.22) 0%, transparent 55%),
            linear-gradient(160deg, #0A1628 0%, #0F2040 45%, #0D1B30 100%)
          `,
          backgroundSize: '28px 28px, 100% 100%, 100% 100%',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-label="Apresentação Karis Atende"
      >
        {/* Decorative arc */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -160,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 380,
            height: 380,
            borderRadius: '50%',
            border: '1.5px solid rgba(103,152,148,.12)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -100,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: '1px solid rgba(103,152,148,.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Top: logo + tagline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/designer/karis-atende-logo-clean.png"
            alt="Karis Atende"
            style={{ height: 52, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />

          <p
            style={{
              marginTop: 28,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              lineHeight: 1.35,
              color: '#FFFFFF',
              maxWidth: 320,
            }}
          >
            Atendimento com IA que{' '}
            <span style={{ color: '#8BBFBB' }}>conecta, atende</span> e resolve.
          </p>

          <p style={{ marginTop: 12, fontSize: 13.5, color: 'rgba(200,215,212,.7)', lineHeight: 1.6, maxWidth: 300 }}>
            Centralize WhatsApp, treine sua IA e acompanhe cada conversa — tudo em um só lugar.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Agentes de IA treinados com seus produtos e serviços',
              'WhatsApp, Instagram e Telegram em uma operação só',
              'Métricas de atendimento em tempo real',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Check />
                <span style={{ fontSize: 13.5, color: 'rgba(220,232,229,.85)', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: testimonial + copyright */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <blockquote
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.09)',
              backdropFilter: 'blur(8px)',
              marginBottom: 32,
            }}
          >
            <p style={{ fontSize: 13, color: 'rgba(215,228,225,.88)', lineHeight: 1.65, fontStyle: 'italic' }}>
              "Depois que conectamos a Karis, nossa equipe parou de perder leads e o tempo de resposta caiu 80%."
            </p>
            <footer style={{ marginTop: 10, fontSize: 11.5, color: 'rgba(170,195,190,.7)', fontStyle: 'normal', fontWeight: 600, letterSpacing: '0.3px' }}>
              — Cliente Karis Atende
            </footer>
          </blockquote>

          <p style={{ fontSize: 11.5, color: 'rgba(160,185,180,.45)', letterSpacing: '0.2px' }}>
            © {new Date().getFullYear()} Karis Atende · Karis Negócios
          </p>
        </div>
      </aside>

      {/* ─── Form panel (left on desktop) ─────────────────────── */}
      <main
        className="flex flex-col items-center justify-center"
        style={{ order: 1, background: '#FFFFFF', padding: '40px 24px' }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ marginBottom: 36, textAlign: 'center' }}>
            <img
              src="/designer/karis-atende-logo-clean.png"
              alt="Karis Atende"
              style={{ height: 44, width: 'auto', margin: '0 auto', objectFit: 'contain' }}
            />
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0F2040, #1a3a60)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
              aria-hidden="true"
            >
              <img
                src="/designer/karis-k-mark.png"
                alt=""
                style={{ width: 28, height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.4px',
                color: '#0F172A',
                marginBottom: 6,
              }}
            >
              Bem-vindo de volta
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748B' }}>
              Entre na sua conta para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* E-mail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label
                htmlFor="login-email"
                style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', letterSpacing: '0.1px' }}
              >
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
                style={inputBase}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#679894'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103,152,148,.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label
                  htmlFor="login-password"
                  style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', letterSpacing: '0.1px' }}
                >
                  Senha
                </label>
                <Link
                  href="/recuperar-senha"
                  style={{ fontSize: 12.5, fontWeight: 600, color: '#679894', textDecoration: 'none' }}
                >
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
                  style={{ ...inputBase, paddingRight: 44 }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#679894'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103,152,148,.12)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    display: 'flex',
                    padding: 0,
                  }}
                >
                  {showPwd ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  fontSize: 13,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 12,
                background: loading ? '#1a3a60' : 'linear-gradient(135deg, #0F2040 0%, #1a3a60 100%)',
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: 700,
                letterSpacing: '0.2px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity .15s, transform .1s',
                opacity: loading ? 0.8 : 1,
                marginTop: 4,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(15,32,64,.25)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading && <Spinner />}
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 24 }}>
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              style={{ color: '#679894', fontWeight: 700, textDecoration: 'none' }}
            >
              Fale com nosso time
            </Link>
          </p>

          {/* Trust line */}
          <div
            style={{
              marginTop: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" style={{ width: 13, height: 13 }} aria-hidden="true">
              <path d="M8 1.5L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1.5z" stroke="#CBD5E1" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 11.5, color: '#CBD5E1', letterSpacing: '0.2px' }}>
              Conexão segura e criptografada
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
