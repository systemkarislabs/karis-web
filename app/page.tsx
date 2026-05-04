'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import DashboardLayout from './(dashboard)/layout'
import { api } from '@/lib/api'
import type { DashboardStats, Conversation } from '@/lib/types'

// ── Gauge SVG ──────────────────────────────────────────────────────────────
function Gauge({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(value / max, 1)
  const r = 54
  const cx = 70
  const cy = 70
  const startAngle = Math.PI
  const endAngle = 0
  const angle = startAngle + pct * (endAngle - startAngle) // goes right to left
  const arcEnd = Math.PI * (1 - pct)

  // arc path
  function polarToXY(a: number) {
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
  }
  const start = polarToXY(Math.PI)
  const end = polarToXY(arcEnd)
  const largeArc = pct > 0.5 ? 0 : 1

  // needle
  const needleAngle = Math.PI * (1 - pct)
  const needleLen = 40
  const nx = cx + needleLen * Math.cos(needleAngle)
  const ny = cy - needleLen * Math.sin(needleAngle)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* bg arc */}
        <path
          d={`M ${polarToXY(Math.PI).x} ${polarToXY(Math.PI).y} A ${r} ${r} 0 0 1 ${polarToXY(0).x} ${polarToXY(0).y}`}
          fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round"
        />
        {/* value arc */}
        {pct > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none" stroke="#0D9488" strokeWidth="10" strokeLinecap="round"
          />
        )}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="#0F172A" />
        {/* value text */}
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F172A">
          {value}
        </text>
      </svg>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  )
}

// ── Mini stat card ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon, trend }: { label: string; value: number | string; icon: React.ReactNode; trend?: number }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
      </div>
      {trend !== undefined && (
        <span className="text-xs font-medium px-2 py-1 rounded-lg"
          style={{ background: trend >= 0 ? '#D1FAE5' : '#FEF2F2', color: trend >= 0 ? '#065F46' : '#991B1B' }}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  )
}

// ── Build chart data from conversations ────────────────────────────────────
function buildChartData(conversations: Conversation[]) {
  const days: Record<string, { name: string; conversas: number; abertas: number }> = {}
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const name = d.toLocaleDateString('pt-BR', { weekday: 'short' })
    days[key] = { name, conversas: 0, abertas: 0 }
  }
  conversations.forEach(c => {
    const key = c.createdAt.slice(0, 10)
    if (days[key]) {
      days[key].conversas++
      if (c.status === 'OPEN') days[key].abertas++
    }
  })
  return Object.values(days)
}

// ── AI vs Human pie ────────────────────────────────────────────────────────
function buildPieData(conversations: Conversation[]) {
  const ai = conversations.filter(c => c.aiEnabled).length
  const human = conversations.length - ai
  return [
    { name: 'IA ativa', value: ai, color: '#0D9488' },
    { name: 'Humano', value: human, color: '#94A3B8' },
  ]
}

// ── Dashboard content ──────────────────────────────────────────────────────
function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [waConnected, setWaConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const statsData = await api.getStats()
        setStats(statsData)

        const [waData, convData] = await Promise.all([
          statsData.company.entitlements.whatsapp ? api.getWhatsappStatus() : Promise.resolve({ status: 'DISCONNECTED' as const, connection: null }),
          api.getConversations(),
        ])
        setWaConnected(waData.status === 'CONNECTED')
        setConversations(convData.conversations)
      } catch { /* noop */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const chartData = buildChartData(conversations)
  const pieData = buildPieData(conversations)
  const openCount = conversations.filter(c => c.status === 'OPEN').length
  const aiRate = conversations.length > 0
    ? Math.round((conversations.filter(c => c.aiEnabled).length / conversations.length) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
          {stats?.company.name ?? 'Bem-vindo'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Visão geral da operação</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard label="Abertas" value={openCount} icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        } />
        {stats?.company.entitlements.ai && (
          <StatCard label="Taxa de IA" value={`${aiRate}%`} icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" />
            </svg>
          } />
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Line chart - 2/3 width */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Conversas — últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#0F172A', fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="conversas" stroke="#0D9488" strokeWidth={2.5}
                dot={{ fill: '#0D9488', r: 3 }} activeDot={{ r: 5 }} name="Total" />
              <Line type="monotone" dataKey="abertas" stroke="#0F766E" strokeWidth={1.5}
                strokeDasharray="4 2" dot={false} name="Abertas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + Gauge - 1/3 */}
        {stats?.company.entitlements.ai && (
          <div className="flex flex-col gap-4">
          {/* Pie */}
          <div className="rounded-2xl p-5 flex-1"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>IA vs Humano</p>
            <div className="flex items-center gap-3">
              <PieChart width={80} height={80}>
                <Pie data={pieData} cx={36} cy={36} innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-1.5">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}: <strong style={{ color: 'var(--text)' }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gauge */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Taxa IA</p>
            <div className="flex justify-center">
              <Gauge value={aiRate} max={100} label="% respondido por IA" />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp */}
        {stats?.company.entitlements.whatsapp && (
          <div className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>WhatsApp</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: waConnected ? '#D1FAE5' : '#FEF3C7', color: waConnected ? '#065F46' : '#92400E' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: waConnected ? '#10B981' : '#F59E0B' }} />
                {waConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {waConnected ? 'Seu número está ativo e recebendo mensagens.' : 'Conecte seu número para receber mensagens.'}
            </p>
            <Link href="/whatsapp" className="text-sm font-medium hover:underline" style={{ color: 'var(--teal)' }}>
              {waConnected ? 'Gerenciar conexão →' : 'Conectar agora →'}
            </Link>
          </div>
        )}

        {/* Assistente */}
        {stats?.company.entitlements.ai && (
          <div className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Assistente IA</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: stats?.assistant?.isActive ? '#D1FAE5' : '#F3F4F6', color: stats?.assistant?.isActive ? '#065F46' : '#6B7280' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: stats?.assistant?.isActive ? '#10B981' : '#9CA3AF' }} />
                {stats?.assistant?.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {stats?.assistant ? `${stats.assistant.name}` : 'Nenhum assistente configurado.'}
            </p>
            <Link href="/assistente" className="text-sm font-medium hover:underline" style={{ color: 'var(--teal)' }}>
              Configurar assistente →
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Acesso rápido</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/conversas', label: 'Ver conversas' },
            { href: '/contatos', label: 'Ver contatos' },
            ...(stats?.company.entitlements.ai ? [{ href: '/conhecimento', label: 'Base de conhecimento' }] : []),
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
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
