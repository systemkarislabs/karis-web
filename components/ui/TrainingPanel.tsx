'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, FileText, Video, Link2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { KnowledgeBase } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'

type TrainingType = 'pdf' | 'video' | 'text'

interface TrainingItem extends KnowledgeBase {
  fileUrl?: string | null
  trainingType?: TrainingType
}

function typeIcon(type?: TrainingType) {
  if (type === 'pdf') return <FileText size={15} aria-hidden="true" />
  if (type === 'video') return <Video size={15} aria-hidden="true" />
  return <FileText size={15} aria-hidden="true" />
}

function typeLabel(type?: TrainingType) {
  if (type === 'pdf') return 'PDF'
  if (type === 'video') return 'Vídeo'
  return 'Texto'
}

function TrainingCard({ item, onDelete }: { item: TrainingItem; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const type = item.trainingType ?? 'text'

  async function handleDelete() {
    if (!confirm('Excluir este material de treinamento?')) return
    setDeleting(true)
    try {
      await api.deleteKnowledge(item.id)
      onDelete(item.id)
    } catch { /* noop */ }
    finally { setDeleting(false) }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
          >
            {typeIcon(type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
              >
                {typeLabel(type)}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {item.fileUrl && (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs mt-1 hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                <Link2 size={11} aria-hidden="true" />
                Abrir arquivo
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {item.content && (
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
          )}
          <Button
            onClick={handleDelete}
            type="button"
            aria-label={`Excluir: ${item.title}`}
            loading={deleting}
            variant="danger"
            size="sm"
            className="!h-9 !w-9 !px-0"
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {expanded && item.content && (
        <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
          {item.content}
        </p>
      )}
    </Card>
  )
}

export function TrainingPanel() {
  const [items, setItems] = useState<TrainingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [trainingType, setTrainingType] = useState<TrainingType>('pdf')
  const [form, setForm] = useState({ title: '', content: '', fileUrl: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    api.getKnowledge()
      .then(d => {
        if (!alive) return
        const all: TrainingItem[] = (d?.knowledge ?? [])
        setItems(all.filter((kb: TrainingItem) => kb.trainingType === 'pdf' || kb.trainingType === 'video'))
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  function resetForm() {
    setForm({ title: '', content: '', fileUrl: '' })
    setTrainingType('pdf')
    setShowForm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        content: form.content || `[${typeLabel(trainingType)}] ${form.fileUrl}`,
        fileUrl: form.fileUrl || undefined,
        trainingType,
      }
      const data = await api.createKnowledge(payload as any)
      setItems(prev => [{ ...data.knowledge, trainingType, fileUrl: form.fileUrl || undefined }, ...prev])
      resetForm()
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Materiais de Treinamento</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {items.length} {items.length === 1 ? 'material' : 'materiais'} · PDFs e vídeos curtos para o agente aprender
          </p>
        </div>
        <Button onClick={() => setShowForm(f => !f)} variant="primary">
          <Plus size={16} aria-hidden="true" />
          Adicionar material
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Novo material</p>

          {/* Type selector */}
          <div className="flex gap-2 mb-5">
            {(['pdf', 'video'] as TrainingType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTrainingType(t)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: trainingType === t ? 'var(--teal)' : 'var(--bg)',
                  color: trainingType === t ? 'white' : 'var(--muted)',
                  border: '1px solid var(--border-soft)',
                }}
              >
                {t === 'pdf' ? <FileText size={13} aria-hidden="true" /> : <Video size={13} aria-hidden="true" />}
                {t === 'pdf' ? 'PDF / Documento' : 'Vídeo curto'}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="training-title" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Título</label>
              <Input
                id="training-title"
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={trainingType === 'pdf' ? 'Ex: Catálogo de produtos 2025…' : 'Ex: Apresentação de boas-vindas…'}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="training-url" className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {trainingType === 'pdf' ? 'URL do PDF' : 'URL do vídeo'}
              </label>
              <Input
                id="training-url"
                type="url"
                value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                placeholder={trainingType === 'pdf' ? 'https://…/documento.pdf' : 'https://youtube.com/… ou link direto'}
              />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {trainingType === 'pdf'
                  ? 'Cole o link público do PDF (Google Drive, Dropbox, etc.)'
                  : 'Cole o link do YouTube, Loom ou vídeo direto (máx. ~5 min)'}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="training-notes" className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Notas adicionais <span style={{ color: 'var(--muted)' }}>(opcional)</span>
              </label>
              <Textarea
                id="training-notes"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Descreva o conteúdo ou pontos-chave que o agente deve aprender com este material…"
                style={{ resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={saving}>
                Salvar
              </Button>
              <Button type="button" onClick={resetForm} variant="ghost">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Info card */}
      <div
        className="rounded-xl p-4 flex gap-3"
        style={{ background: 'color-mix(in oklch, var(--teal) 8%, transparent)', border: '1px solid color-mix(in oklch, var(--teal) 20%, transparent)' }}
      >
        <div className="flex-shrink-0 mt-0.5" style={{ color: 'var(--teal)' }}>
          <FileText size={16} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--teal)' }}>Como funciona</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
            Adicione PDFs de produtos, catálogos ou vídeos curtos de apresentação. O agente usa esses materiais para responder com mais precisão sobre o seu negócio.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="ui-spinner" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum material ainda"
          description="Adicione PDFs ou vídeos curtos para que o agente aprenda sobre seus produtos e serviços."
          action={{ label: 'Adicionar primeiro material', onClick: () => setShowForm(true) }}
          className="border-2 border-dashed"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <TrainingCard
              key={item.id}
              item={item}
              onDelete={id => setItems(prev => prev.filter(i => i.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
