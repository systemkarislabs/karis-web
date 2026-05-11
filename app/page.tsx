'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle, Bot, MessageSquareText, PhoneCall, Users } from 'lucide-react'
import DashboardLayout from './(dashboard)/layout'
import { api } from '@/lib/api'
import type { DashboardStats, Conversation } from '@/lib/types'

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function pctChange(curr: number, prev: number) {
  if (!prev) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function buildHourly(conversations: Conversation[]) {
  const now = Date.now()
  const buckets = Array.from({ length: 24 }, (_, i) => ({
    name: `${String(i).padStart(2, '0')}h`,
    value: 0,
  }))
  for (const c of conversations) {
    const t = new Date(c.createdAt).getTime()
    if (isNaN(t) || now - t > 864e5) continue
    buckets[new Date(t).getHours()].value++
  }
  return buckets
}

function MetricTile({
  label, value, icon, accentVar, sub, subPos,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accentVar: string
  sub?: string
  subPos?: boolean
}) {
  return (
    <div className="dash-tile">
      <div
        className="dash-tile-icon"
        style={{
          background: `color-mix(in oklch, ${accentVar} 11%, transparent)`,
          color: accentVar,
        }}
      >
        {icon}
      </div>
      <div className="dash-tile-body">
        <span className="dash-tile-label">{label}</span>
        <strong className="dash-tile-val">{value.toLocaleString('pt-BR')}</strong>
        {sub && (
          <span
            className="dash-tile-sub"
            style={{
              color:
                subPos === true
                  ? 'var(--success)'
                  : subPos === false
                  ? 'var(--danger)'
                  : 'var(--muted)',
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [convsError, setConvsError] = useState(false)

  useEffect(() => {
    // Chamadas independentes — falha em uma não bloqueia a outra
    api
      .getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))

    api
      .getConversations()
      .then(d => setConversations(d?.conversations ?? []))
      .catch(() => setConvsError(true))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ui-spinner" />
      </div>
    )
  }

  const now = new Date()
  const todayKey = toDateKey(now)
  const yesterdayKey = toDateKey(new Date(now.getTime() - 864e5))
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  // Totais confiáveis do banco (getStats) — não dependem de paginação
  const totalConvs = stats?.stats.conversations ?? 0
  const totalContacts = stats?.stats.contacts ?? 0

  // Métricas computadas do array de conversas
  const openCount = conversations.filter(c => c.status === 'OPEN').length
  const closedCount = conversations.filter(c => c.status === 'CLOSED').length
  const aiCount = conversations.filter(c => c.aiEnabled).length
  const todayCount = conversations.filter(c => c.createdAt.slice(0, 10) === todayKey).length
  const yesterdayCount = conversations.filter(c => c.createdAt.slice(0, 10) === yesterdayKey).length
  const delta = pctChange(todayCount, yesterdayCount)
  const aiRate = conversations.length ? Math.round((aiCount / conversations.length) * 100) : 0

  const hourly = buildHourly(conversations)
  const recent = [...conversations]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 8)

  const agentName = stats?.assistant?.name ?? 'IA'
  const agentActive = stats?.assistant?.isActive ?? false

  return (
    <div className="dashboard-shell">
      {/* Greeting */}
      <div className="dash-hero">
        <div>
          <h1 className="dash-greeting">{greeting}, {stats?.company.name ?? 'Karis Atende'}</h1>
          <p className="dash-date">
            {now.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="dash-agent-pill">
          <span className={`dash-agent-dot${agentActive ? ' on' : ''}`} />
          <Bot size={13} />
          <span>{agentName}</span>
          <span className="dash-agent-badge">{agentActive ? 'Ativa' : 'Pausada'}</span>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="dash-tiles">
        <MetricTile
          label="Total de conversas"
          value={totalConvs}
          icon={<MessageSquareText size={17} />}
          accentVar="var(--teal)"
          sub={delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}% vs. ontem` : 'igual a ontem'}
          subPos={delta >= 0}
        />
        <MetricTile
          label="Contatos"
          value={totalContacts}
          icon={<Users size={17} />}
          accentVar="var(--navy)"
        />
        <MetricTile
          label="Em atendimento"
          value={openCount}
          icon={<PhoneCall size={17} />}
          accentVar="var(--copper)"
          sub={todayCount > 0 ? `${todayCount} hoje` : 'nenhuma hoje'}
        />
        <MetricTile
          label="Atendidas pela IA"
          value={aiCount}
          icon={<Bot size={17} />}
          accentVar="var(--teal)"
          sub={conversations.length > 0 ? `${aiRate}% do total` : 'sem dados'}
        />
      </div>

      {/* Charts */}
      <div className="dash-charts">
        {/* Volume por hora */}
        <div className="dash-chart-panel">
          <div className="dash-panel-head">
            <div>
              <strong>Volume por hora</strong>
              <span>Conversas nas últimas 24 horas</span>
            </div>
          </div>
          {convsError ? (
            <div className="dash-error-state">
              <AlertCircle size={18} />
              <span>Não foi possível carregar as conversas</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={148}>
              <BarChart data={hourly} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9.5, fill: 'var(--subtle)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(90,152,148,.07)' }}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 700, color: 'var(--text)' }}
                  formatter={(v: number) => [v, 'conversas']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--teal)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribuição */}
        <div className="dash-chart-panel">
          <div className="dash-panel-head">
            <div>
              <strong>Distribuição</strong>
              <span>Canal de atendimento</span>
            </div>
          </div>
          <div className="dash-dist">
            {[
              { label: 'Via IA', count: aiCount, color: 'var(--teal)' },
              { label: 'Via humano', count: Math.max(0, conversations.length - aiCount), color: 'var(--copper)' },
              { label: 'Em aberto', count: openCount, color: 'var(--success)' },
              { label: 'Encerradas', count: closedCount, color: 'var(--muted)' },
            ].map(item => {
              const pct = conversations.length > 0 ? Math.round((item.count / conversations.length) * 100) : 0
              return (
                <div key={item.label} className="dash-dist-row">
                  <div className="dash-dist-info">
                    <span>{item.label}</span>
                    <span>
                      {item.count} <em>({pct}%)</em>
                    </span>
                  </div>
                  <div className="dash-dist-track">
                    <div style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent conversations */}
      <div className="dash-recent">
        <div className="dash-recent-head">
          <strong>Conversas recentes</strong>
          <Link href="/conversas">Ver todas →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                {['Contato', 'Telefone', 'Status', 'Agente', 'Há'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="dash-empty">
                    {convsError
                      ? 'Erro ao carregar — verifique a conexão com o servidor.'
                      : 'Nenhuma conversa ainda. Quando o WhatsApp receber mensagens, elas aparecerão aqui.'}
                  </td>
                </tr>
              ) : (
                recent.map(r => {
                  const name = r.contact.name ?? r.contact.phone
                  const agent = r.assignedUser?.name ?? (r.aiEnabled ? agentName : '—')
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/conversas/${r.id}`} className="dash-row-link">
                          <span className="dash-av">{name[0]?.toUpperCase()}</span>
                          {name}
                        </Link>
                      </td>
                      <td>{r.contact.phone}</td>
                      <td>
                        <span className={`dash-badge ${r.status === 'OPEN' ? 'open' : 'closed'}`}>
                          {r.status === 'OPEN' ? 'Aberta' : 'Encerrada'}
                        </span>
                      </td>
                      <td>{agent}</td>
                      <td>{timeAgo(r.updatedAt ?? r.createdAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
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
