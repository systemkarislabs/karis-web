'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { Contact, CrmDeal, CrmPipeline, CrmStage } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([])
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [stages, setStages] = useState<CrmStage[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const [showNew, setShowNew] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState({ title: '', contactId: '', valueCents: '' })
  const [creating, setCreating] = useState(false)

  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [activeDeal, setActiveDeal] = useState<CrmDeal | null>(null)
  const [dealLoading, setDealLoading] = useState(false)
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([api.getCrmPipelines(), api.getContacts()])
      .then(([p, c]) => {
        if (!alive) return
        setPipelines(p.pipelines ?? [])
        setContacts(c.contacts ?? [])
        const first = p.pipelines?.[0]?.id ?? null
        setPipelineId(first)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!pipelineId) return
    const p = pipelines.find(x => x.id === pipelineId)
    setStages(p?.stages ?? [])
  }, [pipelineId, pipelines])

  useEffect(() => {
    if (!pipelineId) return
    let alive = true
    setLoading(true)
    api.getCrmDeals({ pipelineId, q: q.trim() || undefined })
      .then(d => { if (alive) setDeals(d.deals ?? []) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [pipelineId, q])

  useEffect(() => {
    if (!activeDealId) {
      setActiveDeal(null)
      return
    }
    let alive = true
    setDealLoading(true)
    api.getCrmDeal(activeDealId)
      .then(d => { if (alive) setActiveDeal(d.deal) })
      .catch(() => { if (alive) setActiveDeal(null) })
      .finally(() => { if (alive) setDealLoading(false) })
    return () => { alive = false }
  }, [activeDealId])

  const grouped = useMemo(() => {
    const map = new Map<string, CrmDeal[]>()
    for (const s of stages) map.set(s.id, [])
    for (const d of deals) {
      const list = map.get(d.stage?.id) ?? []
      list.push(d)
      map.set(d.stage?.id, list)
    }
    return map
  }, [deals, stages])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!pipelineId) return
    setCreating(true)
    try {
      const valueCents = form.valueCents.trim() ? Number(form.valueCents) : null
      const data = await api.createCrmDeal({
        title: form.title,
        contactId: form.contactId,
        pipelineId,
        valueCents: valueCents !== null && Number.isFinite(valueCents) ? valueCents : null
      })
      setDeals(prev => [data.deal, ...prev])
      setForm({ title: '', contactId: '', valueCents: '' })
      setShowNew(false)
      setActiveDealId(data.deal.id)
    } catch { /* noop */ }
    finally { setCreating(false) }
  }

  async function handleMove(dealId: string, stageId: string) {
    try {
      const data = await api.updateCrmDeal(dealId, { stageId })
      setDeals(prev => prev.map(d => (d.id === dealId ? data.deal : d)))
      if (activeDeal?.id === dealId) setActiveDeal(data.deal)
    } catch { /* noop */ }
  }

  async function handleAddNote() {
    if (!activeDealId || !note.trim()) return
    setNoteSaving(true)
    try {
      await api.addCrmDealNote(activeDealId, note.trim())
      setNote('')
      const d = await api.getCrmDeal(activeDealId)
      setActiveDeal(d.deal)
    } catch { /* noop */ }
    finally { setNoteSaving(false) }
  }

  return (
    <div className="ops-designer-page crm-designer-page flex flex-col gap-4">
      <SectionHeader
        title="CRM"
        description="Negócios e funil"
        right={
          <div className="flex items-center gap-2">
            <select
              value={pipelineId ?? ''}
              onChange={e => setPipelineId(e.target.value || null)}
              className="h-10 rounded-xl px-3 text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
              aria-label="Selecionar pipeline"
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button variant="primary" onClick={() => setShowNew(v => !v)}>
              Novo negócio
            </Button>
          </div>
        }
      />

      <div className="ops-metric-strip">
        <div className="ops-metric-card brand">
          <span>Negócios</span>
          <strong>{deals.length}</strong>
        </div>
        <div className="ops-metric-card">
          <span>Etapas</span>
          <strong>{stages.length}</strong>
        </div>
        <div className="ops-metric-card">
          <span>Pipelines</span>
          <strong>{pipelines.length}</strong>
        </div>
      </div>

      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar por título, nome ou telefone…"
      />

      {showNew && (
        <Card className="ops-panel p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Criar negócio</p>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Título</label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="Ex: Plano Mensal - João"
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Valor (centavos)</label>
              <Input
                value={form.valueCents}
                onChange={e => setForm(f => ({ ...f, valueCents: e.target.value }))}
                placeholder="Ex: 9900"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs" style={{ color: 'var(--muted)' }}>Contato</label>
              <select
                value={form.contactId}
                onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))}
                className="h-11 rounded-xl px-3 w-full text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
                required
              >
                <option value="">Selecione…</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {(c.name ? `${c.name} — ` : '')}{c.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" variant="primary" loading={creating}>Salvar</Button>
              <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="ui-spinner" />
        </div>
      ) : stages.length === 0 ? (
        <EmptyState title="Nenhum estágio" description="Crie um pipeline para começar." className="border-2 border-dashed" />
      ) : (
        <div className="crm-board-grid">
          {stages.map(stage => {
            const list = grouped.get(stage.id) ?? []
            return (
              <Card key={stage.id} className="ops-panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{stage.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{list.length} negócios</p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color ?? 'var(--border)' }} />
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {list.length === 0 ? (
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>Sem negócios</div>
                  ) : (
                    list.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setActiveDealId(d.id)}
                        className="text-left p-3 rounded-xl transition-colors"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{d.title}</div>
                            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                              {(d.contact?.name ? `${d.contact.name} • ` : '')}{d.contact?.phone}
                            </div>
                          </div>
                          {typeof d.aiScore === 'number' ? (
                            <div className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                              {d.aiScore}%
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <select
                    className="h-10 rounded-xl px-3 w-full text-sm"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
                    value=""
                    onChange={e => {
                      const v = e.target.value
                      if (!v) return
                      const [dealId, nextStageId] = v.split(':')
                      handleMove(dealId, nextStageId)
                      e.target.value = ''
                    }}
                    aria-label={`Mover negócio para ${stage.name}`}
                  >
                    <option value="">Mover…</option>
                    {list.map(d => stages.filter(s => s.id !== stage.id).map(s => (
                      <option key={`${d.id}:${s.id}`} value={`${d.id}:${s.id}`}>
                        {d.title} → {s.name}
                      </option>
                    )))}
                  </select>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeDealId && (
        <Card className="ops-panel p-5">
          {dealLoading || !activeDeal ? (
            <div className="flex items-center justify-center h-24">
              <div className="ui-spinner" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{activeDeal.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {(activeDeal.contact?.name ? `${activeDeal.contact.name} • ` : '')}{activeDeal.contact?.phone}
                  </div>
                  {activeDeal.aiNextAction ? (
                    <div className="text-xs mt-2 p-2 rounded-xl" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                      Próxima ação (IA): {activeDeal.aiNextAction}
                    </div>
                  ) : null}
                </div>
                <Button variant="ghost" onClick={() => setActiveDealId(null)}>Fechar</Button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notas</div>
                <div className="flex gap-2">
                  <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Adicionar nota…" />
                  <Button variant="primary" onClick={handleAddNote} loading={noteSaving}>Salvar</Button>
                </div>
                {(activeDeal.notes?.length ?? 0) === 0 ? (
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Sem notas ainda</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeDeal.notes!.slice(0, 10).map(n => (
                      <div key={n.id} className="text-sm p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{new Date(n.createdAt).toLocaleString('pt-BR')}</div>
                        {n.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

