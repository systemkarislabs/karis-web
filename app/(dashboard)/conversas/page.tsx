'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Conversation } from '@/lib/types'

function StatusBadge({ status }: { status: 'OPEN' | 'CLOSED' }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: status === 'OPEN' ? '#D1FAE5' : '#F3F4F6',
        color: status === 'OPEN' ? '#065F46' : '#6B7280',
      }}
    >
      {status === 'OPEN' ? 'Aberta' : 'Fechada'}
    </span>
  )
}

function AiBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: enabled ? '#EFF6FF' : '#F3F4F6',
        color: enabled ? '#1D4ED8' : '#9CA3AF',
      }}
    >
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

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')

  useEffect(() => {
    api.getConversations()
      .then(d => setConversations(d.conversations))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = conversations.filter(c => filter === 'ALL' || c.status === filter)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Conversas</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{conversations.length} no total</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
          {(['ALL', 'OPEN', 'CLOSED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filter === f ? 'var(--teal)' : 'transparent',
                color: filter === f ? 'white' : 'var(--muted)',
              }}
            >
              {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
            {filtered.map(conv => (
              <li key={conv.id}>
                <Link
                  href={`/conversas/${conv.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                  >
                    {(conv.contact.name ?? conv.contact.phone).charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                        {conv.contact.name ?? conv.contact.phone}
                      </span>
                      {conv.source && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>
                          {conv.source}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {conv.contact.phone} · {conv._count?.messages ?? 0} msgs
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={conv.status} />
                    <div className="flex items-center gap-1.5">
                      <AiBadge enabled={conv.aiEnabled} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(conv.updatedAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
