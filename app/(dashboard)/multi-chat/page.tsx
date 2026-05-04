'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Conversation, Message } from '@/lib/types'

function MessageBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === 'OUTBOUND'
  const isAI = msg.senderType === 'AI'
  const isSystem = msg.senderType === 'SYSTEM'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-xs md:max-w-md">
        {isAI && (
          <p className="text-xs mb-1 ml-1" style={{ color: 'var(--teal)' }}>IA</p>
        )}
        <div
          className="px-3.5 py-2.5 rounded-2xl text-sm"
          style={{
            background: isOutbound ? 'linear-gradient(135deg,#0D9488,#0F766E)' : 'var(--surface)',
            color: isOutbound ? 'white' : 'var(--text)',
            border: isOutbound ? 'none' : '1px solid var(--border-soft)',
            borderRadius: isOutbound ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {msg.content}
        </div>
        <p className={`text-xs mt-1 ${isOutbound ? 'text-right mr-1' : 'ml-1'}`} style={{ color: 'var(--muted)' }}>
          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
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

export default function MultiChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [query, setQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let alive = true
    api.getMyCompany()
      .then(({ company }) => {
        if (!alive) return
        if (!company.entitlements?.modules?.multichat) {
          router.replace('/')
          return
        }

        api.getConversations()
          .then(d => {
            if (!alive) return
            const list = d?.conversations ?? []
            setConversations(list)
            if (!activeId && list.length) setActiveId(list[0].id)
          })
          .catch(() => {})
          .finally(() => { if (alive) setLoading(false) })
      })
      .catch(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(c => {
      const name = (c.contact.name ?? '').toLowerCase()
      const phone = (c.contact.phone ?? '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })
  }, [conversations, query])

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await api.getMessages(conversationId)
      setMessages(data.messages)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId)

    pollRef.current = setInterval(() => loadMessages(activeId), 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeId || !text.trim() || sending) return
    setSending(true)
    try {
      const data = await api.sendMessage(activeId, text.trim())
      setMessages(prev => [...prev, data.message])
      setText('')
    } catch { /* noop */ }
    finally { setSending(false) }
  }

  const active = conversations.find(c => c.id === activeId) ?? null

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-112px)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Multi-chat</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Atenda múltiplas conversas em uma única tela</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="lg:col-span-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
            <div className="p-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nome ou telefone…"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-sm" style={{ color: 'var(--muted)' }}>Nenhuma conversa.</div>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {filtered.map(c => {
                    const isActive = c.id === activeId
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => setActiveId(c.id)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                          style={{ background: isActive ? 'var(--teal-soft)' : 'transparent' }}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                          >
                            {(c.contact.name ?? c.contact.phone).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                              {c.contact.name ?? c.contact.phone}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                              {c.contact.phone} · {timeAgo(c.updatedAt)}
                            </div>
                          </div>
                          <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                            style={{ background: c.status === 'OPEN' ? '#D1FAE5' : '#F3F4F6', color: c.status === 'OPEN' ? '#065F46' : '#6B7280' }}>
                            {c.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col min-h-0"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}>
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
                Selecione uma conversa
              </div>
            ) : (
              <>
                <div className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                  >
                    {(active.contact.name ?? active.contact.phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {active.contact.name ?? active.contact.phone}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{active.contact.phone}</div>
                  </div>
                  <button
                    onClick={() => router.push(`/conversas/${active.id}`)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid #99F6E4' }}
                  >
                    Abrir detalhe
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--muted)' }}>
                      Nenhuma mensagem ainda
                    </div>
                  ) : (
                    messages.map(m => <MessageBubble key={m.id} msg={m} />)
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="px-4 py-3 flex items-center gap-3"
                  style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Digite uma mensagem…"
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ color: 'var(--text)' }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

