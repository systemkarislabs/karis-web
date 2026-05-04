'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

export default function ConversaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [conversation, setConversation] = useState<(Conversation & { messages: Message[] }) | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [takeover, setTakeover] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(id)
      setMessages(data.messages)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch { /* noop */ }
  }, [id])

  useEffect(() => {
    async function init() {
      try {
        const data = await api.getConversation(id)
        setConversation(data.conversation)
        setMessages(data.conversation.messages)
        api.markConversationRead(id).catch(() => {})
        const active = data.conversation.humanTakeovers?.some(t => !t.endedAt) ?? false
        setTakeover(active)
      } catch { router.push('/conversas') }
      finally { setLoading(false) }
    }
    init()
    // Poll every 5s
    pollRef.current = setInterval(loadMessages, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id, router, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const data = await api.sendMessage(id, text.trim())
      setMessages(prev => [...prev, data.message])
      setText('')
    } catch { /* noop */ }
    finally { setSending(false) }
  }

  async function toggleAi() {
    if (!conversation) return
    try {
      const updated = await api.updateConversation(id, { aiEnabled: !conversation.aiEnabled })
      setConversation(c => c ? { ...c, aiEnabled: updated.conversation.aiEnabled } : c)
    } catch { /* noop */ }
  }

  async function handleTakeover() {
    if (!conversation) return
    if (takeover) {
      await api.endTakeover(id, true)
      setTakeover(false)
      setConversation(c => c ? { ...c, aiEnabled: true } : c)
    } else {
      await api.startTakeover(id, 'Atendimento manual')
      setTakeover(true)
      setConversation(c => c ? { ...c, aiEnabled: false } : c)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!conversation) return null

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-128px)]">
      {/* Header */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-3 mb-4 flex-shrink-0"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        <button onClick={() => router.push('/conversas')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--muted)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
        >
          {(conversation.contact.name ?? conversation.contact.phone).charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {conversation.contact.name ?? conversation.contact.phone}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{conversation.contact.phone}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI toggle */}
          <button
            onClick={toggleAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: conversation.aiEnabled ? '#EFF6FF' : '#F3F4F6',
              color: conversation.aiEnabled ? '#1D4ED8' : '#9CA3AF',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            IA {conversation.aiEnabled ? 'ativa' : 'pausada'}
          </button>

          {/* Takeover toggle */}
          <button
            onClick={handleTakeover}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: takeover ? '#FEF3C7' : 'var(--teal-soft)',
              color: takeover ? '#92400E' : 'var(--teal)',
            }}
          >
            {takeover ? 'Devolver IA' : 'Assumir'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl p-4 flex flex-col gap-2 mb-4"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 flex-shrink-0"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
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
    </div>
  )
}
