'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from './(dashboard)/layout'
import { api } from '@/lib/api'
import type { DashboardStats } from '@/lib/types'

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [waConnected, setWaConnected] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [statsData, waData] = await Promise.all([
          api.getStats(),
          api.getWhatsappStatus(),
        ])
        setStats(statsData)
        setWaConnected(waData.status === 'CONNECTED')
      } catch { /* noop */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
          {stats?.company.name ?? 'Bem-vindo'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Aqui está um resumo da sua operação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Contatos" value={stats?.stats.contacts ?? 0} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        } />
        <StatCard label="Conversas" value={stats?.stats.conversations ?? 0} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        } />
        <StatCard label="Usuários" value={stats?.stats.users ?? 0} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        } />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>WhatsApp</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: waConnected ? '#D1FAE5' : '#FEF3C7', color: waConnected ? '#065F46' : '#92400E' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: waConnected ? '#10B981' : '#F59E0B' }} />
              {waConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {waConnected ? 'Seu número está ativo e recebendo mensagens.' : 'Conecte seu número para receber e enviar mensagens.'}
          </p>
          <Link href="/whatsapp" className="text-sm font-medium hover:underline" style={{ color: 'var(--teal)' }}>
            {waConnected ? 'Gerenciar conexão →' : 'Conectar agora →'}
          </Link>
        </div>

        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Assistente IA</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: stats?.assistant?.isActive ? '#D1FAE5' : '#F3F4F6', color: stats?.assistant?.isActive ? '#065F46' : '#6B7280' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: stats?.assistant?.isActive ? '#10B981' : '#9CA3AF' }} />
              {stats?.assistant?.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {stats?.assistant ? `${stats.assistant.name} — configure as instruções.` : 'Nenhum assistente configurado.'}
          </p>
          <Link href="/assistente" className="text-sm font-medium hover:underline" style={{ color: 'var(--teal)' }}>
            Configurar assistente →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Acesso rápido</p>
        <div className="flex flex-wrap gap-2">
          {[{ href: '/conversas', label: 'Ver conversas' }, { href: '/contatos', label: 'Ver contatos' }, { href: '/conhecimento', label: 'Base de conhecimento' }].map(l => (
            <Link key={l.href} href={l.href} className="px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
              style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}
