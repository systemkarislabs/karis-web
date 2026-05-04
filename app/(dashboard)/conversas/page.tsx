'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { Conversation } from '@/lib/types'

// ── Lead stage (stored in conv.campaign field as prefix "stage:xxx") ────────
type LeadStage = 'novo' | 'analise' | 'aprovado' | 'descartado'

const STAGES: Record<LeadStage, { label: string; bg: string; color: string; dot: string }> = {
  novo:       { label: 'Novo lead',   bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  analise:    { label: 'Em análise',  bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  aprovado:   { label: 'Aprovado',    bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  descartado: { label: 'Descartado',  bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
}

function getStage(conv: Conversation): LeadStage | null {
  if (!conv.campaign) return null
  const match = conv.campaign.match(/^stage:(\w+)/)
  return match ? (match[1] as LeadStage) : null
}

function LeadStageBadge({ stage }: { stage: LeadStage }) {
  const s = STAGES[stage]
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

function StatusBadge({ status }: { status: 'OPEN' | 'CLOSED' }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: status === 'OPEN' ? '#D1FAE5' : '#F3F4F6', color: status === 'OPEN' ? '#065F46' : '#6B7280' }}>
      {status === 'OPEN' ? 'Aberta' : 'Fechada'}
    </span>
  )
}

function AiBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: enabled ? '#EFF6FF' : '#F3F4F6', color: enabled ? '#1D4ED8' : '#9CA3AF' }}>
      {enabled ? 'IA ativa' : 'IA pausada'}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function snippet(text: string, max = 60) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1) + '…'
}

function exportCSV(conversations: Conversation[]) {
  const header = ['Contato', 'Telefone', 'Status', 'IA', 'Fonte', 'Mensagens', 'Atualizado']
  const rows = conversations.map(c => [
    c.contact.name ?? '',
    c.contact.phone,
    c.status === 'OPEN' ? 'Aberta' : 'Fechada',
    c.aiEnabled ? 'Sim' : 'Não',
    c.source ?? '',
    String(c._count?.messages ?? 0),
    new Date(c.updatedAt).toLocaleDateString('pt-BR'),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conversas-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Filter = 'ALL' | 'OPEN' | 'CLOSED'
type StageFilter = 'ALL' | LeadStage

export default function ConversasPage() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL')
  const [markingAll, setMarkingAll] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await api.getConversations()
      setConversations(d?.conversations ?? [])
    } catch {
      toast('Erro ao carregar conversas', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [toast])

  const filtered = conversations.filter(c => {
    if (filter !== 'ALL' && c.status !== filter) return false
    if (stageFilter !== 'ALL' && getStage(c) !== stageFilter) return false
    return true
  })

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)

  async function markAllRead() {
    if (markingAll) return
    setMarkingAll(true)
    try {
      await api.markAllConversationsRead()
      toast('Tudo marcado como lido', 'success')
      await load()
    } catch (e: any) {
      toast(e?.message || 'Erro ao marcar como lido', 'error')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Conversas</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{conversations.length} no total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={markAllRead}
            disabled={markingAll || totalUnread === 0}
            className="px-3.5 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}
          >
            Marcar tudo como lido{totalUnread > 0 ? ` (${totalUnread})` : ''}
          </button>

          {/* Status filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
            {(['ALL', 'OPEN', 'CLOSED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: filter === f ? 'var(--teal)' : 'transparent', color: filter === f ? 'white' : 'var(--muted)' }}>
                {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
              </button>
            ))}
          </div>

          {/* Export */}
          <button onClick={() => { if (!filtered.length) return toast('Nenhuma conversa para exportar', 'warning'); exportCSV(filtered); toast(`${filtered.length} conversas exportadas`, 'success') }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid #99F6E4' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setStageFilter('ALL')}
          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
          style={{ background: stageFilter === 'ALL' ? '#0F172A' : '#F1F5F9', color: stageFilter === 'ALL' ? 'white' : 'var(--muted)' }}>
          Todos os estágios
        </button>
        {(Object.keys(STAGES) as LeadStage[]).map(s => {
          const st = STAGES[s]
          const active = stageFilter === s
          return (
            <button key={s} onClick={() => setStageFilter(active ? 'ALL' : s)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{ background: active ? st.bg : '#F1F5F9', color: active ? st.color : 'var(--muted)', border: active ? `1px solid ${st.dot}40` : '1px solid transparent' }}>
              {st.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
            {filtered.map(conv => {
              const stage = getStage(conv)
              const preview = conv.lastMessage?.content ? snippet(conv.lastMessage.content, 64) : ''
              const assigneeLabel = conv.assignedUser?.name ? `Atendente · ${conv.assignedUser.name.split(' ')[0]}` : ''
              return (
                <li key={conv.id}>
                  <Link href={`/conversas/${conv.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
                      {(conv.contact.name ?? conv.contact.phone).charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {conv.contact.name ?? conv.contact.phone}
                        </span>
                        {typeof conv.unreadCount === 'number' && conv.unreadCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(13,148,136,.14)', color: 'var(--teal)' }}>
                            {conv.unreadCount}
                          </span>
                        )}
                        {!!assigneeLabel && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                            {assigneeLabel}
                          </span>
                        )}
                        {conv.source && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                            style={{ background: '#FEF3C7', color: '#92400E' }}>
                            {conv.source}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {conv.contact.phone}
                        {preview ? ` · ${preview}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {stage ? <LeadStageBadge stage={stage} /> : <StatusBadge status={conv.status} />}
                      <AiBadge enabled={conv.aiEnabled} />
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(conv.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
