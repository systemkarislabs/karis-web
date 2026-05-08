'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bot, CheckCheck, MessageSquareText, Send } from 'lucide-react'
import { api } from '@/lib/api'
import type { Conversation, Message } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
        <p className={`text-xs mt-1 ${isOutbound ? 'text-right mr-1 inline-flex items-center justify-end gap-1 w-full' : 'ml-1'}`} style={{ color: 'var(--muted)' }}>
          <span>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          {isOutbound && <CheckCheck size={14} strokeWidth={2.4} aria-label="Mensagem enviada" style={{ color: '#64C7BE' }} />}
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
        <div className="ui-spinner" />
      </div>
    )
  }

  if (!conversation) return null

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-128px)]">
      {/* Header */}
      <Card className="px-5 py-4 flex items-center gap-3 mb-4 flex-shrink-0">
        <button type="button" aria-label="Voltar para conversas" onClick={() => router.push('/conversas')} className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={18} aria-hidden="true" />
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
            <Bot size={13} aria-hidden="true" />
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
      </Card>

      {/* Messages */}
      <Card className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageSquareText size={32} aria-hidden="true" style={{ color: 'var(--muted)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </Card>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="ui-card flex items-center gap-3 rounded-[var(--radius-xl)] px-4 py-3 flex-shrink-0"
      >
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Digite uma mensagem…"
          aria-label="Digite uma mensagem"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: 'var(--text)' }}
        />
        <Button
          type="submit"
          aria-label="Enviar mensagem"
          variant="primary"
          loading={sending}
          disabled={!text.trim()}
          className="!w-10 !h-10 !px-0 rounded-xl"
        >
          <Send size={16} aria-hidden="true" />
        </Button>
      </form>
    </div>
  )
}
