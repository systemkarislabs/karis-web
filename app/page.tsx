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

function KPI({
  label,
  value,
  delta,
  deltaPos,
  icon,
  accent,
}: {
  label: string
  value: string
  delta?: string
  deltaPos?: boolean
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div
      className="screen-enter"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `color-mix(in oklch, ${accent} 10%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: accent,
          }}
        >
          {icon}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 750, color: 'var(--text)', letterSpacing: '-0.8px', lineHeight: 1 }}>
          {value}
        </div>
        {delta ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', color: deltaPos ? 'var(--success)' : 'var(--danger)' }}>
              {deltaPos ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
            </span>
            <span style={{ fontSize: 12, fontWeight: 650, color: deltaPos ? 'var(--success)' : 'var(--danger)' }}>
              {delta}
            </span>
            <span style={{ fontSize: 12, color: 'var(--subtle)' }}>vs. ontem</span>
          </div>
        ) : null}
      </div>
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
    <div className="flex flex-col gap-6" style={{ padding: 28 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          {stats?.company.name ?? 'Karis Atende'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Visão geral do dia</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[14px]">
        <KPI
          label="Conversas Hoje"
          value={String(todayConversations)}
          delta={`${convDeltaPct >= 0 ? '+' : ''}${convDeltaPct}%`}
          deltaPos={convDeltaPct >= 0}
          icon={<MessageSquareText size={16} aria-hidden="true" />}
          accent="var(--primary)"
        />
        <KPI
          label="Atendimentos Ativos"
          value={String(openCount)}
          icon={<Users size={16} aria-hidden="true" />}
          accent="var(--success)"
        />
        <KPI
          label="Taxa de Resolução"
          value={`${resolutionRate.toLocaleString('pt-BR')}%`}
          icon={<Check size={16} aria-hidden="true" />}
          accent="var(--success)"
        />
        <KPI
          label="Tempo Médio"
          value="—"
          icon={<Clock size={16} aria-hidden="true" />}
          accent="oklch(62% 0.16 200)"
        />
        <KPI
          label="Agentes Ativos"
          value="—"
          icon={<Bot size={16} aria-hidden="true" />}
          accent="oklch(60% 0.16 280)"
        />
        <KPI
          label="Taxa de IA"
          value={`${aiRate}%`}
          icon={<Calendar size={16} aria-hidden="true" />}
          accent="var(--primary)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-[14px]">
        <div
          className="screen-enter"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)' }}>Conversas por Hora</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Últimas 24 horas</div>
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
                fill="color-mix(in oklch, var(--primary) 35%, oklch(93% 0.008 240))"
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
          className="screen-enter"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 22px',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--text)', marginBottom: 16 }}>Performance Agentes</div>
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
