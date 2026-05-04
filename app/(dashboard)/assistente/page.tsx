'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Info } from 'lucide-react'
import { api } from '@/lib/api'
import type { Assistant } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function AssistentePage() {
  const router = useRouter()
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [form, setForm] = useState({ name: '', instructions: '', isActive: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    api.getMyCompany()
      .then(({ company }) => {
        if (!alive) return
        if (!company.entitlements.ai) {
          router.replace('/')
          return
        }

        api.getAssistant()
          .then(d => {
            if (!alive) return
            setAssistant(d.assistant)
            setForm({
              name: d.assistant.name ?? '',
              instructions: d.assistant.instructions ?? '',
              isActive: d.assistant.isActive,
            })
          })
          .catch(() => {})
          .finally(() => { if (alive) setLoading(false) })
      })
      .catch(() => { if (alive) setLoading(false) })

    return () => { alive = false }
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

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <SectionHeader title="Assistente IA" description="Configure o comportamento do seu assistente" />

      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="ui-spinner" />
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
              <label htmlFor="assistant-name" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Nome do assistente</label>
              <Input
                id="assistant-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Karis, Atendente, Sofia…"
                required
              />
            </div>

            {/* Instructions */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="assistant-instructions" className="text-sm font-medium" style={{ color: 'var(--text)' }}>Instruções do sistema</label>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Descreva como o assistente deve se comportar, o tom, limitações e informações da empresa.
              </p>
              <Textarea
                id="assistant-instructions"
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Você é um assistente de atendimento da [Empresa]. Seja sempre cordial, objetivo e responda em português. Não forneça informações sobre preços sem consultar um humano."
                style={{ lineHeight: '1.6' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                Salvar alterações
              </Button>
              {saved && (
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--teal)' }}>
                  <Check size={16} aria-hidden="true" />
                  Salvo!
                </span>
              )}
            </div>
          </form>
        )}
      </Card>

      <Card className="p-5 flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Base de Conhecimento</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Gerencie os conteúdos que o agente usa para responder com contexto.
          </p>
        </div>
        <div>
          <Link
            href="/conhecimento"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
            style={{ background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid #99F6E4' }}
          >
            Abrir base de conhecimento
          </Link>
        </div>
      </Card>

      {/* Info card */}
      <div
        className="rounded-2xl p-5 flex gap-3"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
      >
        <Info size={18} aria-hidden="true" color="#3B82F6" className="flex-shrink-0 mt-0.5" />
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
