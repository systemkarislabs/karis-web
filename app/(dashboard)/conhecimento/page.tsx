'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { KnowledgeBase } from '@/lib/types'

function KnowledgeCard({ kb, onDelete }: { kb: KnowledgeBase; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir este item da base de conhecimento?')) return
    setDeleting(true)
    try {
      await api.deleteKnowledge(kb.id)
      onDelete(kb.id)
    } catch { /* noop */ }
    finally { setDeleting(false) }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{kb.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {new Date(kb.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={expanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            style={{ color: 'var(--danger)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && kb.content && (
        <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
          {kb.content}
        </p>
      )}
    </div>
  )
}

export default function ConhecimentoPage() {
  const [items, setItems] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getKnowledge()
      .then(d => setItems(d?.knowledgeBases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await api.createKnowledge(form)
      setItems(prev => [data.knowledgeBase, ...prev])
      setForm({ title: '', content: '' })
      setShowForm(false)
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all'
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Base de Conhecimento</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>

      {/* New item form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Novo item</p>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Título</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Horário de funcionamento, Política de troca…"
                required
                className={inputClass}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Conteúdo</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Escreva as informações que o assistente deve saber sobre este tópico…"
                rows={5}
                required
                className={inputClass}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm({ title: '', content: '' }) }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: 'var(--muted)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center h-48 gap-3"
          style={{ background: 'var(--surface)', border: '2px dashed var(--border)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum conteúdo ainda</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--teal)' }}
          >
            Adicionar o primeiro item
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(kb => (
            <KnowledgeCard
              key={kb.id}
              kb={kb}
              onDelete={id => setItems(prev => prev.filter(i => i.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
