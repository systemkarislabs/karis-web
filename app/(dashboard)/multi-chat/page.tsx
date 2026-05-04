'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Conversation, HumanTakeover, Message } from '@/lib/types'

function MessageBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === 'OUTBOUND'
  const isAI = msg.senderType === 'AI'
  const isSystem = msg.senderType === 'SYSTEM'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--bg)', color: 'var(--subtle)', border: '1px solid var(--border-soft)' }}>
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

function snippet(text: string, max = 60) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1) + '…'
}

export default function MultiChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | 'MINE' | 'UNASSIGNED'>('ALL')
  const [togglingAi, setTogglingAi] = useState(false)
  const [togglingTakeover, setTogglingTakeover] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [togglingAssignee, setTogglingAssignee] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentUserRef = useRef<{ id: string; role: 'ADMIN' | 'AGENT' } | null>(null)

  useEffect(() => {
    let alive = true
    try {
      const raw = localStorage.getItem('karisCurrentUser')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.id && parsed?.role) currentUserRef.current = { id: parsed.id, role: parsed.role }
      }
    } catch { /* noop */ }

    api.getMyCompany()
      .then(({ company }) => {
        if (!alive) return
        setAiAvailable(Boolean(company.entitlements.ai))

        const refreshList = () =>
          api.getConversations()
          .then(d => {
            if (!alive) return
            const list = (d?.conversations ?? []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            setConversations(list)
            if (!activeId && list.length) setActiveId(list[0].id)
          })
          .catch(() => {})
          .finally(() => { if (alive) setLoading(false) })

        refreshList()

        listPollRef.current = setInterval(refreshList, 10000)
      })
      .catch(() => { if (alive) setLoading(false) })

    return () => {
      alive = false
      if (listPollRef.current) clearInterval(listPollRef.current)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter(c => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false
      const meId = currentUserRef.current?.id
      if (assigneeFilter === 'MINE' && (!meId || c.assignedUser?.id !== meId)) return false
      if (assigneeFilter === 'UNASSIGNED' && c.assignedUser) return false
      if (!q) return true
      const name = (c.contact.name ?? '').toLowerCase()
      const phone = (c.contact.phone ?? '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })
  }, [conversations, query, statusFilter, assigneeFilter])

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
    api.markConversationRead(activeId).catch(() => {})

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
  const takeoverActive = Boolean(active?.humanTakeovers?.some(t => !t.endedAt)) || Boolean(active?.humanTakeovers?.length)
  const takeoverUserName =
    active?.humanTakeovers?.find(t => !t.endedAt)?.user?.name ??
    active?.humanTakeovers?.[0]?.user?.name ??
    ''
  const assigneeName = active?.assignedUser?.name ?? ''
  const isAssignedToMe = Boolean(active?.assignedUser?.id && active?.assignedUser?.id === currentUserRef.current?.id)
  const canOverrideAssignee = currentUserRef.current?.role === 'ADMIN'

  function updateConversationLocal(id: string, patch: Partial<Conversation>) {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function toggleAi() {
    if (!active || togglingAi) return
    setTogglingAi(true)
    try {
      const updated = await api.updateConversation(active.id, { aiEnabled: !active.aiEnabled })
      updateConversationLocal(active.id, { aiEnabled: updated.conversation.aiEnabled })
    } catch { /* noop */ }
    finally { setTogglingAi(false) }
  }

  async function toggleTakeover() {
    if (!active || togglingTakeover) return
    setTogglingTakeover(true)
    try {
      if (takeoverActive) {
        await api.endTakeover(active.id, true)
        updateConversationLocal(active.id, { aiEnabled: true, humanTakeovers: [] })
      } else {
        const data = await api.startTakeover(active.id, 'Atendimento manual')
        const takeover: HumanTakeover = data.takeover as any
        updateConversationLocal(active.id, { aiEnabled: false, humanTakeovers: [takeover] })
      }
    } catch { /* noop */ }
    finally { setTogglingTakeover(false) }
  }

  async function toggleStatus() {
    if (!active || togglingStatus) return
    setTogglingStatus(true)
    try {
      const nextStatus = active.status === 'OPEN' ? 'CLOSED' : 'OPEN'
      const updated = await api.updateConversation(active.id, { status: nextStatus })
      updateConversationLocal(active.id, {
        status: updated.conversation.status as any,
        aiEnabled: updated.conversation.aiEnabled,
        ...(nextStatus === 'CLOSED' ? { humanTakeovers: [] } : {}),
      })
    } catch { /* noop */ }
    finally { setTogglingStatus(false) }
  }

  async function setAssignee(userId: string | null) {
    if (!active || togglingAssignee) return
    setTogglingAssignee(true)
    try {
      const updated = await api.setConversationAssignee(active.id, userId)
      updateConversationLocal(active.id, { assignedUser: updated.conversation.assignedUser ?? null })
    } catch { /* noop */ }
    finally { setTogglingAssignee(false) }
  }

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
            <div className="p-3 flex flex-col gap-2" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                {(['ALL', 'OPEN', 'CLOSED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: statusFilter === f ? 'var(--teal)' : 'transparent', color: statusFilter === f ? 'white' : 'var(--muted)' }}
                  >
                    {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                {(['ALL', 'MINE', 'UNASSIGNED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAssigneeFilter(f)}
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: assigneeFilter === f ? 'var(--teal)' : 'transparent', color: assigneeFilter === f ? 'white' : 'var(--muted)' }}
                  >
                    {f === 'ALL' ? 'Todas' : f === 'MINE' ? 'Minhas' : 'Sem atendente'}
                  </button>
                ))}
              </div>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nome ou telefone…"
                aria-label="Buscar conversas"
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
                    const activeTakeover = c.humanTakeovers?.find(t => !t.endedAt) ?? c.humanTakeovers?.[0] ?? null
                    const hasTakeover = Boolean(activeTakeover)
                    const manualLabel = activeTakeover?.user?.name ? `Manual · ${activeTakeover.user.name.split(' ')[0]}` : 'Manual'
                    const preview = c.lastMessage?.content ? snippet(c.lastMessage.content, 52) : ''
                    const assigneeLabel = c.assignedUser?.name ? `Atendente · ${c.assignedUser.name.split(' ')[0]}` : ''
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => setActiveId(c.id)}
                          type="button"
                          aria-pressed={isActive}
                          aria-label={`Abrir conversa com ${c.contact.name ?? c.contact.phone}`}
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
                              {c.contact.phone}
                              {preview ? ` · ${preview}` : ''}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                              style={{ background: c.status === 'OPEN' ? '#D1FAE5' : '#F3F4F6', color: c.status === 'OPEN' ? '#065F46' : '#6B7280' }}>
                              {c.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                            </div>
                            {typeof c.unreadCount === 'number' && c.unreadCount > 0 && (
                              <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                style={{ background: 'rgba(13,148,136,.14)', color: 'var(--teal)' }}>
                                {c.unreadCount}
                              </div>
                            )}
                            {!!assigneeLabel && (
                              <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                                {assigneeLabel}
                              </div>
                            )}
                            {hasTakeover && (
                              <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                style={{ background: '#FEF3C7', color: '#92400E' }}>
                                {manualLabel}
                              </div>
                            )}
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
                  <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={{ background: active.status === 'OPEN' ? '#D1FAE5' : '#F3F4F6', color: active.status === 'OPEN' ? '#065F46' : '#6B7280' }}>
                    {active.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                  </div>
                  {active.assignedUser?.id ? (
                    <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                      {assigneeName ? `Atendente · ${assigneeName.split(' ')[0]}` : 'Atendente'}
                    </div>
                  ) : (
                    <div className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: '#F3F4F6', color: '#6B7280' }}>
                      Sem atendente
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const myId = currentUserRef.current?.id
                        if (!myId) return
                        if (active.assignedUser?.id && !isAssignedToMe && !canOverrideAssignee) return
                        setAssignee(myId)
                      }}
                      disabled={togglingAssignee || !currentUserRef.current?.id || (Boolean(active.assignedUser?.id) && !isAssignedToMe && !canOverrideAssignee)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                      style={{ background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.18)', color: '#1D4ED8' }}
                    >
                      {active.assignedUser?.id ? (isAssignedToMe ? 'Atribuída a mim' : 'Tomar') : 'Atribuir a mim'}
                    </button>
                    <button
                      onClick={() => {
                        if (active.assignedUser?.id && !isAssignedToMe && !canOverrideAssignee) return
                        setAssignee(null)
                      }}
                      disabled={togglingAssignee || !active.assignedUser?.id || (!isAssignedToMe && !canOverrideAssignee)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                      style={{ background: '#F3F4F6', border: '1px solid var(--border-soft)', color: '#6B7280' }}
                    >
                      Liberar
                    </button>
                  </div>
                  {aiAvailable && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAi}
                        disabled={togglingAi}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{
                          background: active.aiEnabled ? '#EFF6FF' : '#F3F4F6',
                          color: active.aiEnabled ? '#1D4ED8' : '#9CA3AF',
                          border: '1px solid var(--border-soft)',
                        }}
                      >
                        IA {active.aiEnabled ? 'ativa' : 'pausada'}
                      </button>
                      <button
                        onClick={toggleTakeover}
                        disabled={togglingTakeover}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{
                          background: takeoverActive ? '#FEF3C7' : 'var(--teal-soft)',
                          color: takeoverActive ? '#92400E' : 'var(--teal)',
                          border: '1px solid var(--border-soft)',
                        }}
                      >
                        {takeoverActive ? (takeoverUserName ? `Devolver IA (${takeoverUserName.split(' ')[0]})` : 'Devolver IA') : 'Assumir'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={toggleStatus}
                    disabled={togglingStatus}
                    className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                    style={{
                      background: active.status === 'OPEN' ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)',
                      border: active.status === 'OPEN' ? '1px solid rgba(239,68,68,.22)' : '1px solid rgba(16,185,129,.22)',
                      color: active.status === 'OPEN' ? '#B91C1C' : '#065F46',
                    }}
                  >
                    {active.status === 'OPEN' ? 'Fechar' : 'Reabrir'}
                  </button>
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
                    aria-label="Digite uma mensagem"
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ color: 'var(--text)' }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending || active.status === 'CLOSED'}
                    aria-label="Enviar mensagem"
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
