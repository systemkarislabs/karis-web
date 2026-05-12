'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Bot, Check, Phone, Power, Sparkles, Wand2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'

const PERSONALITY_OPTIONS = [
  { value: 'prestativo', label: 'Prestativo', desc: 'Acolhedor, proativo e caloroso' },
  { value: 'direto', label: 'Direto', desc: 'Objetivo e eficiente, sem rodeios' },
  { value: 'formal', label: 'Formal', desc: 'Tom profissional e respeitoso' },
  { value: 'descontraido', label: 'Descontraído', desc: 'Casual, bem-humorado e próximo' },
]

export function AssistantSettingsPanel({ showHint = true }: { showHint?: boolean }) {
  const [form, setForm] = useState({
    name: '',
    instructions: '',
    isActive: true,
    personality: '' as string,
    transferPhone: '',
    transferConditions: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicDesc, setMagicDesc] = useState('')
  const [showMagic, setShowMagic] = useState(false)
  const [magicError, setMagicError] = useState('')
  const [magicDone, setMagicDone] = useState(false)

  useEffect(() => {
    let alive = true
    api.getAssistant()
      .then(d => {
        if (!alive) return
        setForm({
          name: d.assistant.name ?? '',
          instructions: d.assistant.instructions ?? '',
          isActive: d.assistant.isActive,
          personality: d.assistant.personality ?? '',
          transferPhone: d.assistant.transferPhone ?? '',
          transferConditions: d.assistant.transferConditions ?? '',
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
      await api.upsertAssistant({
        name: form.name,
        instructions: form.instructions,
        isActive: form.isActive,
        personality: form.personality || undefined,
        transferPhone: form.transferPhone || null,
        transferConditions: form.transferConditions || null,
      })
      setSaved(true)
      setSaveError('')
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setSaveError(err?.message || 'Erro ao salvar. Tente novamente.')
    } finally { setSaving(false) }
  }

  async function handleMagicPrompt() {
    if (!magicDesc.trim() && !form.instructions.trim()) {
      setMagicError('Descreva sua empresa ou adicione um comportamento atual para a IA melhorar.')
      return
    }
    setMagicLoading(true)
    setMagicError('')
    setMagicDone(false)
    try {
      const res = await api.aiMagicPrompt({
        description: magicDesc || undefined,
        currentPrompt: form.instructions || undefined,
        assistantName: form.name || undefined,
      })
      if (!res.prompt) {
        setMagicError('A IA não conseguiu gerar um prompt. Tente novamente.')
        return
      }
      setForm(f => ({ ...f, instructions: res.prompt }))
      setMagicDone(true)
      setMagicDesc('')
      setTimeout(() => setMagicDone(false), 3000)
    } catch {
      setMagicError('Falha ao conectar com a IA. Tente novamente.')
    } finally {
      setMagicLoading(false)
    }
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
            {/* Status */}
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
                    : 'A IA fica silenciosa enquanto a operação assume.'}
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

            {/* Nome + chip */}
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

            {/* Personalidade */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Personalidade
              </label>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Define o tom e o estilo de comunicação da agente com os clientes.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {PERSONALITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, personality: f.personality === opt.value ? '' : opt.value }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${form.personality === opt.value ? 'var(--teal)' : 'var(--border-soft)'}`,
                      background: form.personality === opt.value ? 'var(--teal-faint, rgba(13,148,136,.08))' : 'var(--surface)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: form.personality === opt.value ? 'var(--teal)' : 'var(--text)' }}>
                      {opt.label}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginTop: 2 }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comportamento + Magic Prompt */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <label htmlFor="assistant-instructions" className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Comportamento da agente
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Defina tom de voz, limites, regras de atendimento e informações da empresa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowMagic(v => !v); setMagicError(''); setMagicDone(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 8, border: '1.5px solid var(--teal)', background: 'transparent',
                    color: 'var(--teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}
                >
                  <Wand2 size={14} />
                  Magic Prompt
                </button>
              </div>

              {showMagic && (
                <div style={{
                  border: '1.5px solid var(--teal)', borderRadius: 10,
                  padding: 14, background: 'var(--teal-faint, rgba(13,148,136,.06))',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--teal)', margin: 0 }}>
                    ✨ Descreva sua empresa e a IA cria ou melhora o comportamento automaticamente
                  </p>
                  <Textarea
                    value={magicDesc}
                    onChange={e => { setMagicDesc(e.target.value); setMagicError('') }}
                    placeholder="Ex: Somos uma clínica de estética. Atendemos agendamentos, dúvidas sobre procedimentos e valores. A agente deve ser acolhedora e indicar o WhatsApp do gerente para pagamentos..."
                    style={{ minHeight: 90, fontSize: 13 }}
                  />
                  {magicError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 13 }}>
                      <AlertCircle size={14} />
                      {magicError}
                    </div>
                  )}
                  {magicDone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}>
                      <Check size={14} />
                      Comportamento atualizado pela IA — revise abaixo e salve.
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      type="button"
                      variant="primary"
                      loading={magicLoading}
                      onClick={handleMagicPrompt}
                    >
                      {magicLoading ? 'Gerando...' : form.instructions ? 'Melhorar com IA' : 'Criar com IA'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setShowMagic(false); setMagicDesc(''); setMagicError(''); setMagicDone(false) }}
                      style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              <Textarea
                id="assistant-instructions"
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Você é a agente de atendimento da empresa. Seja cordial, objetiva e responda em português."
                style={{ lineHeight: '1.6', minHeight: 180 }}
              />
            </div>

            {/* Transferência */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-semibold" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} />
                  Transferência para atendente humano
                </label>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Quando a IA detectar que precisa transferir, ela notifica esse número no WhatsApp com o contato, assunto e horário.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-phone" className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  Números de WhatsApp
                </label>
                <Input
                  id="transfer-phone"
                  type="text"
                  value={form.transferPhone}
                  onChange={e => setForm(f => ({ ...f, transferPhone: e.target.value }))}
                  placeholder="Ex: 5511999999999, 5521988887777 (separe por vírgula)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-conditions" className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  Quando transferir
                </label>
                <Input
                  id="transfer-conditions"
                  type="text"
                  value={form.transferConditions}
                  onChange={e => setForm(f => ({ ...f, transferConditions: e.target.value }))}
                  placeholder="Ex: quando o cliente quiser efetuar pagamento, pedir desconto ou falar com um consultor"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                Salvar alterações
              </Button>
              {saved && (
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--teal)' }}>
                  <Check size={16} aria-hidden="true" />
                  Salvo
                </span>
              )}
              {saveError && (
                <span className="text-sm" style={{ color: 'var(--red)' }}>
                  {saveError}
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
