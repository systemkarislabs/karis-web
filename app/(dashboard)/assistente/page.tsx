'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Assistant } from '@/lib/types'

export default function AssistentePage() {
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [form, setForm] = useState({ name: '', instructions: '', isActive: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getAssistant()
      .then(d => {
        setAssistant(d.assistant)
        setForm({
          name: d.assistant.name ?? '',
          instructions: d.assistant.instructions ?? '',
          isActive: d.assistant.isActive,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const data = await api.upsertAssistant(form)
      setAssistant(data.assistant)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all'
  const inputStyle = { border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Assistente IA</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Configure o comportamento do seu assistente</p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-soft)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Status toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Assistente ativo</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {form.isActive ? 'Responde automaticamente às mensagens' : 'Aguardando ativação'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                style={{ background: form.isActive ? 'var(--teal)' : '#D1D5DB' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: form.isActive ? 'translateX(20px)' : 'translateX(2px)' }}
                />
              </button>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nome do assistente</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Karis, Atendente, Sofia…"
                required
                className={inputClass}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Instruções do sistema</label>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Descreva como o assistente deve se comportar, o tom, limitações e informações da empresa.
              </p>
              <textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Você é um assistente de atendimento da [Empresa]. Seja sempre cordial, objetivo e responda em português. Não forneça informações sobre preços sem consultar um humano."
                rows={8}
                className={inputClass}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                onFocus={e => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}
              >
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
              {saved && (
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--teal)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Salvo!
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Info card */}
      <div
        className="rounded-2xl p-5 flex gap-3"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p className="text-sm font-medium" style={{ color: '#1D4ED8' }}>Dica</p>
          <p className="text-sm mt-0.5" style={{ color: '#1E40AF' }}>
            Combine as instruções com a base de conhecimento para respostas mais precisas. O assistente usará ambos para responder seus clientes.
          </p>
        </div>
      </div>
    </div>
  )
}
