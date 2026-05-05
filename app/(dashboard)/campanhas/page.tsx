'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { Campaign, CrmPipeline } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function CampanhasPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', message: '', stageId: '' })

  const stages = useMemo(() => pipelines[0]?.stages ?? [], [pipelines])

  useEffect(() => {
    let alive = true
    Promise.all([api.getCrmPipelines(), api.getCampaigns()])
      .then(([p, c]) => {
        if (!alive) return
        setPipelines(p.pipelines ?? [])
        setCampaigns(c.campaigns ?? [])
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const data = await api.createCampaign({
        name: form.name.trim(),
        message: form.message.trim(),
        stageId: form.stageId ? form.stageId : null
      })
      setCampaigns(prev => [data.campaign, ...prev])
      setForm({ name: '', message: '', stageId: '' })
    } catch { /* noop */ }
    finally { setCreating(false) }
  }

  async function handleSend(id: string) {
    setSendingId(id)
    try {
      await api.sendCampaign(id)
      const d = await api.getCampaigns()
      setCampaigns(d.campaigns ?? [])
    } catch { /* noop */ }
    finally { setSendingId(null) }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <SectionHeader title="Campanhas" description="Disparos via WhatsApp" />

      <Card className="p-6">
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Nova campanha</p>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Nome</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Promoção do mês" />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Segmento (estágio do CRM)</label>
              <select
                value={form.stageId}
                onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))}
                className="h-11 rounded-xl px-3 w-full text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
              >
                <option value="">Todos (opt-in)</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Mensagem</label>
            <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required placeholder="Digite a mensagem que será enviada pelo WhatsApp…" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={creating}>Criar</Button>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Envio respeita opt-in (opted_in_whatsapp) e exige WhatsApp conectado.
          </p>
        </form>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="ui-spinner" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState title="Nenhuma campanha" description="Crie sua primeira campanha para disparar no WhatsApp." className="border-2 border-dashed" />
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Status: {c.status}
                    {typeof c._count?.recipients === 'number' ? ` • ${c._count.recipients} destinatários` : ''}
                  </div>
                  <div className="text-sm mt-3 whitespace-pre-wrap" style={{ color: 'var(--muted)' }}>
                    {c.message}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="primary"
                    loading={sendingId === c.id}
                    onClick={() => handleSend(c.id)}
                    disabled={c.status === 'RUNNING'}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

