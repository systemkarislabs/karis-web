'use client'

import { useEffect, useState } from 'react'
import { Bot, Check, Power, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'

export function AssistantSettingsPanel({ showHint = true }: { showHint?: boolean }) {
  const [form, setForm] = useState({ name: '', instructions: '', isActive: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    api.getAssistant()
      .then(d => {
        if (!alive) return
        setForm({
          name: d.assistant.name ?? '',
          instructions: d.assistant.instructions ?? '',
          isActive: d.assistant.isActive,
        })
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await api.upsertAssistant(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="ia-agent-card">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="ui-spinner" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="ia-agent-status">
              <div className="ia-agent-avatar">
                <Bot size={22} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p>Status da agente</p>
                <strong>{form.isActive ? 'Ativa' : 'Pausada'}</strong>
                <span>
                  {form.isActive
                    ? 'A IA responde automaticamente quando a conversa permitir.'
                    : 'A IA fica silenciosa enquanto a opera\u00e7\u00e3o assume.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={form.isActive ? 'ia-power-toggle active' : 'ia-power-toggle'}
                aria-pressed={form.isActive}
                aria-label={form.isActive ? 'Pausar agente' : 'Ativar agente'}
              >
                <Power size={15} aria-hidden="true" />
                <span>{form.isActive ? 'Ativa' : 'Pausada'}</span>
              </button>
            </div>

            <div className="ia-form-grid">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="assistant-name" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Nome da agente
                </label>
                <Input
                  id="assistant-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Sofia, Clara, Karis"
                  required
                />
              </div>

              <div className="ia-agent-chip">
                <Sparkles size={16} aria-hidden="true" />
                <div>
                  <strong>Modo Karis</strong>
                  <span>Tom humano, objetivo e conectado ao atendimento.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="assistant-instructions" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Comportamento da agente
              </label>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Defina tom de voz, limites, regras de atendimento e informa\u00e7\u00f5es da empresa.
              </p>
              <Textarea
                id="assistant-instructions"
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder={'Voc\u00ea \u00e9 a agente de atendimento da empresa. Seja cordial, objetiva e responda em portugu\u00eas.'}
                style={{ lineHeight: '1.6', minHeight: 180 }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                Salvar altera\u00e7\u00f5es
              </Button>
              {saved && (
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--teal)' }}>
                  <Check size={16} aria-hidden="true" />
                  Salvo
                </span>
              )}
            </div>
          </form>
        )}
      </Card>

      {showHint && (
        <div className="ia-hint">
          Combine comportamento, base de conhecimento e materiais de treinamento para respostas mais precisas.
        </div>
      )}
    </div>
  )
}
