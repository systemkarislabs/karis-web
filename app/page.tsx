'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Bot, Calendar, Check, Clock, MessageSquareText, TrendingDown, TrendingUp, Users } from 'lucide-react'
import DashboardLayout from './(dashboard)/layout'
import { api } from '@/lib/api'
import type { DashboardStats, Conversation } from '@/lib/types'

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max))
}

function pctChange(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}

function buildHourlyData(conversations: Conversation[]) {
  const now = Date.now()
  const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, value: 0 }))
  for (const c of conversations) {
    const t = new Date(c.createdAt).getTime()
    if (Number.isNaN(t)) continue
    if (now - t > 24 * 60 * 60 * 1000) continue
    const h = new Date(t).getHours()
    buckets[h].value += 1
  }
  return buckets.map(b => ({
    name: `${String(b.hour).padStart(2, '0')}h`,
    value: b.value,
    hour: b.hour,
  }))
}

function MetricCard({
  label,
  value,
  delta,
  deltaPos,
  tone = 'light',
}: {
  label: string
  value: string
  delta?: string
  deltaPos?: boolean
  tone?: 'light' | 'brand'
}) {
  const brand = tone === 'brand'
  return (
    <div
      className="screen-enter dashboard-card"
      style={{
        padding: '18px 18px',
        minHeight: 96,
        background: brand ? 'linear-gradient(135deg, var(--teal), var(--navy))' : '#fff',
        color: brand ? '#fff' : 'var(--text)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: brand ? 'rgba(255,255,255,.76)' : 'var(--muted)' }}>{label}</div>
        <div style={{ width: 17, height: 17, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand ? 'rgba(255,255,255,.8)' : 'var(--subtle)', border: `1px solid ${brand ? 'rgba(255,255,255,.24)' : 'var(--border)'}`, fontSize: 11 }}>i</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 850, lineHeight: 1, marginTop: 13, letterSpacing: '-.8px' }}>{value}</div>
      {delta ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, fontWeight: 700, color: brand ? '#E7FFF8' : deltaPos ? 'var(--success)' : 'var(--danger)' }}>
          {deltaPos ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
          <span>{delta} this month</span>
        </div>
      ) : null}
    </div>
  )
}

// ── Dashboard content ──────────────────────────────────────────────────────
function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const statsData = await api.getStats()
        setStats(statsData)

        const convData = await api.getConversations()
        setConversations(convData.conversations)
      } catch { /* noop */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="ui-spinner" />
      </div>
    )
  }

  const openCount = conversations.filter(c => c.status === 'OPEN').length
  const closedCount = conversations.filter(c => c.status === 'CLOSED').length
  const resolutionRate = conversations.length ? Math.round((closedCount / conversations.length) * 1000) / 10 : 0

  const now = new Date()
  const todayKey = toDateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday)

  const todayConversations = conversations.filter(c => c.createdAt.slice(0, 10) === todayKey).length
  const yesterdayConversations = conversations.filter(c => c.createdAt.slice(0, 10) === yesterdayKey).length
  const convDeltaPct = pctChange(todayConversations, yesterdayConversations)

  const aiCount = conversations.filter(c => c.aiEnabled).length
  const aiRate = conversations.length ? Math.round((aiCount / conversations.length) * 100) : 0

  const hourly = buildHourlyData(conversations)
  const maxHour = Math.max(1, ...hourly.map(d => d.value))

  const recent = [...conversations]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 6)

  return (
    <div className="dashboard-shell">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: '-.5px', color: 'var(--text)' }}>
            Bom dia, {stats?.company.name ?? 'Karis Atende'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5 }}>Acompanhe conversas, IA e operação do dia.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Hoje', '7 dias', '30 dias'].map((label, index) => (
            <button
              key={label}
              type="button"
              className={`top-pill ${index === 0 ? 'top-pill-active' : ''}`}
              style={{ border: '1px solid var(--border-soft)', background: index === 0 ? '#101318' : '#fff' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-[14px]">
        <div className="dashboard-card" style={{ padding: 18, minHeight: 206 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--muted)' }}>Total de Conversas</div>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1, marginTop: 10, color: 'var(--text)' }}>
                {conversations.length.toLocaleString('pt-BR')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, fontWeight: 750, color: convDeltaPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {convDeltaPct >= 0 ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
                <span>{convDeltaPct >= 0 ? '+' : ''}{convDeltaPct}% vs. ontem</span>
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: 'var(--navy)', background: '#fff' }}>
              Karis IA
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Link href="/conversas" className="ui-btn" style={{ height: 36, flex: 1, borderRadius: 999, background: '#101318', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <MessageSquareText size={14} /> Abrir Conversas
            </Link>
            <Link href="/ia" className="ui-btn" style={{ height: 36, flex: 1, borderRadius: 999, background: '#fff', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Bot size={14} /> Ajustar IA
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 22 }}>
            {[
              { label: 'Abertas', value: openCount, status: 'Ativo' },
              { label: 'Resolvidas', value: closedCount, status: 'Ok' },
              { label: 'Com IA', value: aiCount, status: 'Auto' },
            ].map(item => (
              <div key={item.label} style={{ background: '#F7F9FC', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '12px 10px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 750 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 7, color: 'var(--text)' }}>{item.value}</div>
                <span style={{ display: 'inline-flex', marginTop: 6, padding: '2px 7px', borderRadius: 999, background: 'rgba(57,217,138,.12)', color: 'var(--success)', fontSize: 10, fontWeight: 800 }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-[14px]">
          <MetricCard label="Conversas hoje" value={String(todayConversations)} delta={`${convDeltaPct >= 0 ? '+' : ''}${convDeltaPct}%`} deltaPos={convDeltaPct >= 0} tone="brand" />
          <MetricCard label="Ativos" value={String(openCount)} />
          <MetricCard label="Resolução" value={`${resolutionRate.toLocaleString('pt-BR')}%`} delta="+8%" deltaPos />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-[14px]">
        <div
          className="screen-enter premium-panel"
          style={{
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Income Tracking</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Conversas por hora nas últimas 24 horas</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['1D', '7D', '30D'].map(p => {
                const on = p === '1D'
                return (
                  <button
                    key={p}
                    type="button"
                    className="ui-btn"
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 650,
                      border: on ? `1px solid var(--primary)` : '1px solid var(--border)',
                      background: on ? 'color-mix(in oklch, var(--primary) 8%, transparent)' : 'transparent',
                      color: on ? 'var(--primary)' : 'var(--muted)',
                    }}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} interval={3} />
              <Tooltip
                cursor={{ fill: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)', fontWeight: 700 }}
              />
              <Bar
                dataKey="value"
                radius={[3, 3, 0, 0]}
                fill="var(--copper)"
              />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {['00h', '04h', '08h', '12h', '16h', '20h', '23h'].map(t => (
              <span key={t} style={{ fontSize: 10.5, color: 'var(--subtle)' }}>{t}</span>
            ))}
          </div>
          <div className="sr-only" aria-live="polite">
            Pico horário: {hourly.find(d => d.value === maxHour)?.name ?? '—'}
          </div>
        </div>

        <div
          className="screen-enter premium-panel"
          style={{
            padding: '20px 22px',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Budget Management</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'IA', conversations: aiCount, resolved: clamp(Math.round(aiCount * 0.9), 0, aiCount), rate: `${aiRate}%`, accent: 'var(--primary)' },
              { name: 'Humano', conversations: conversations.length - aiCount, resolved: clamp(Math.round((conversations.length - aiCount) * 0.85), 0, conversations.length - aiCount), rate: `${100 - aiRate}%`, accent: 'oklch(52% 0.15 145)' },
            ].map(a => (
              <div key={a.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: `color-mix(in oklch, ${a.accent} 12%, transparent)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        color: a.accent,
                      }}
                    >
                      {a.name[0]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 650, color: 'oklch(25% 0.03 240)' }}>{a.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{a.rate}</span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: 'oklch(94% 0.006 240)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: a.rate, borderRadius: 9999, background: a.accent }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.conversations} conversas · {a.resolved} resolvidas</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="screen-enter"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)' }}>Conversas Recentes</div>
          <Link
            href="/conversas"
            className="ui-btn"
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 650,
              border: `1px solid var(--primary)`,
              color: 'var(--primary)',
              background: 'color-mix(in oklch, var(--primary) 6%, transparent)',
            }}
          >
            Ver todas
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-3)' }}>
                {['Contato', 'Canal', 'Status', 'Agente', 'Tempo'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 22px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--muted)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => {
                const name = r.contact.name ?? r.contact.phone
                const channel = 'WhatsApp'
                const statusLabel = r.status === 'OPEN' ? 'Em atendimento' : 'Concluído'
                const statusType = r.status === 'OPEN' ? 'info' : 'success'
                const agent = r.assignedUser?.name ?? (r.aiEnabled ? 'Sofia IA' : '—')
                const time = timeAgo(r.updatedAt ?? r.createdAt)

                const badgeColors: Record<string, { bg: string; text: string }> = {
                  success: { bg: 'oklch(96% 0.04 145)', text: 'oklch(38% 0.14 145)' },
                  info: { bg: 'oklch(96% 0.04 240)', text: 'oklch(42% 0.15 240)' },
                  warning: { bg: 'oklch(97% 0.06 85)', text: 'oklch(48% 0.16 85)' },
                }
                const bc = badgeColors[statusType] ?? badgeColors.info

                return (
                  <tr
                    key={r.id ?? i}
                    style={{ borderTop: '1px solid var(--border-soft)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'oklch(98% 0.003 240)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 22px', fontWeight: 650, color: 'oklch(22% 0.04 240)' }}>{name}</td>
                    <td style={{ padding: '12px 22px', color: 'var(--muted)' }}>{channel}</td>
                    <td style={{ padding: '12px 22px' }}>
                      <span style={{ background: bc.bg, color: bc.text, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.3px', padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 22px', color: 'var(--muted)' }}>{agent}</td>
                    <td style={{ padding: '12px 22px', color: 'var(--muted)', fontSize: 12 }}>{time} atrás</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!recent.length && (
          <div style={{ padding: 18, color: 'var(--muted)', fontSize: 13 }}>
            Nenhuma conversa ainda.
          </div>
        )}
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
