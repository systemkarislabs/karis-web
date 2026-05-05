'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { KnowledgeBase } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'

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
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{kb.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {new Date(kb.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => setExpanded(e => !e)}
            type="button"
            aria-label={expanded ? 'Recolher conteúdo' : 'Expandir conteúdo'}
            variant="ghost"
            size="sm"
            className="!h-9 !w-9 !px-0"
          >
            {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </Button>
          <Button
            onClick={handleDelete}
            type="button"
            aria-label={`Excluir item: ${kb.title}`}
            loading={deleting}
            variant="danger"
            size="sm"
            className="!h-9 !w-9 !px-0"
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {expanded && kb.content && (
        <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
          {kb.content}
        </p>
      )}
    </Card>
  )
}

export function KnowledgeBasePanel() {
  const [items, setItems] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    api.getKnowledge()
      .then(d => { if (alive) setItems(d?.knowledgeBases ?? []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
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

  const titleId = 'kb-title'
  const contentId = 'kb-content'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Base de Conhecimento</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <Button onClick={() => setShowForm(f => !f)} variant="primary">
          <Plus size={16} aria-hidden="true" />
          Adicionar
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Novo item</p>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={titleId} className="text-sm font-medium" style={{ color: 'var(--text)' }}>Título</label>
              <Input
                id={titleId}
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Horário de funcionamento, Política de troca…"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={contentId} className="text-sm font-medium" style={{ color: 'var(--text)' }}>Conteúdo</label>
              <Textarea
                id={contentId}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Escreva as informações que o assistente deve saber sobre este tópico…"
                required
                style={{ resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={saving}>
                Salvar
              </Button>
              <Button
                type="button"
                onClick={() => { setShowForm(false); setForm({ title: '', content: '' }) }}
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="ui-spinner" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo ainda"
          description="Crie itens para dar mais contexto às respostas do agente."
          action={{ label: 'Adicionar primeiro item', onClick: () => setShowForm(true) }}
          className="border-2 border-dashed"
        />
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

