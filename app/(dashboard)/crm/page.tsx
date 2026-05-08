'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clock3, DollarSign, Flame, MessageCircle, Plus, Search, Settings2, Target, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Contact, CrmDeal, CrmPipeline, CrmStage, CrmTask, FollowUp, FollowUpSetting } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

type DealView = CrmDeal & {
  followUps?: FollowUp[]
  conversation?: { id: string; updatedAt?: string; messages?: Array<{ content: string; createdAt: string }> } | null
}

const delayOptions = [15, 30, 45] as const

function money(value: number | null | undefined, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format((value ?? 0) / 100)
}

function shortDate(value?: string | null) {
  if (!value) return 'Sem prazo'
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function scoreLabel(score?: number | null) {
  if (typeof score !== 'number') return 'Sem score'
  if (score >= 75) return 'Quente'
  if (score >= 45) return 'Morno'
  return 'Frio'
}

function scoreColor(score?: number | null) {
  if (typeof score !== 'number') return '#64748B'
  if (score >= 75) return '#F97316'
  if (score >= 45) return '#0D9488'
  return '#64748B'
}

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([])
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [stages, setStages] = useState<CrmStage[]>([])
  const [deals, setDeals] = useState<DealView[]>([])
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [setting, setSetting] = useState<FollowUpSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [temperature, setTemperature] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL')
  const [view, setView] = useState<'board' | 'insights' | 'settings'>('board')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', contactId: '', valueCents: '' })
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [activeDeal, setActiveDeal] = useState<DealView | null>(null)
  const [note, setNote] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueAt, setTaskDueAt] = useState('')
  const [savingSetting, setSavingSetting] = useState(false)

  async function loadBase() {
    setLoading(true)
    try {
      const [p, c, s, t] = await Promise.all([
        api.getCrmPipelines(),
        api.getContacts(),
        api.getFollowUpSetting(),
        api.getCrmTasks({ status: 'OPEN' }),
      ])
      setPipelines(p.pipelines ?? [])
      setContacts(c.contacts ?? [])
      setSetting(s.setting)
      setTasks(t.tasks ?? [])
      setPipelineId(prev => prev ?? p.pipelines?.[0]?.id ?? null)
    } finally {
      setLoading(false)
    }
  }

  async function loadDeals(nextPipelineId = pipelineId) {
    if (!nextPipelineId) return
    const data = await api.getCrmDeals({ pipelineId: nextPipelineId, q: q.trim() || undefined })
    setDeals((data.deals ?? []) as DealView[])
  }

  useEffect(() => { loadBase().catch(() => setLoading(false)) }, [])

  useEffect(() => {
    const p = pipelines.find(x => x.id === pipelineId)
    setStages(p?.stages ?? [])
  }, [pipelineId, pipelines])

  useEffect(() => { loadDeals().catch(() => {}) }, [pipelineId, q])

  useEffect(() => {
    if (!activeDealId) {
      setActiveDeal(null)
      return
    }
    api.getCrmDeal(activeDealId).then(d => setActiveDeal(d.deal as DealView)).catch(() => setActiveDeal(null))
  }, [activeDealId])

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (temperature === 'HOT') return (d.aiScore ?? 0) >= 75
      if (temperature === 'WARM') return (d.aiScore ?? 0) >= 45 && (d.aiScore ?? 0) < 75
      if (temperature === 'COLD') return typeof d.aiScore !== 'number' || d.aiScore < 45
      return true
    })
  }, [deals, temperature])

  const grouped = useMemo(() => {
    const map = new Map<string, DealView[]>()
    for (const s of stages) map.set(s.id, [])
    for (const d of filteredDeals) {
      const list = map.get(d.stage?.id) ?? []
      list.push(d)
      map.set(d.stage?.id, list)
    }
    return map
  }, [filteredDeals, stages])

  const metrics = useMemo(() => {
    const open = deals.filter(d => d.status === 'OPEN')
    const won = deals.filter(d => d.status === 'WON')
    const pendingFollowUps = deals.reduce((sum, d) => sum + (d.followUps?.filter(f => f.status === 'PENDING').length ?? 0), 0)
    const revenue = won.reduce((sum, d) => sum + (d.valueCents ?? 0), 0)
    const weighted = open.reduce((sum, d) => sum + Math.round((d.valueCents ?? 0) * ((d.aiScore ?? 30) / 100)), 0)
    return { open: open.length, won: won.length, revenue, weighted, pendingFollowUps, overdueTasks: tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date()).length }
  }, [deals, tasks])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!pipelineId) return
    const valueCents = form.valueCents.trim() ? Number(form.valueCents) : null
    const data = await api.createCrmDeal({
      title: form.title,
      contactId: form.contactId,
      pipelineId,
      valueCents: valueCents !== null && Number.isFinite(valueCents) ? valueCents : null
    })
    setDeals(prev => [data.deal as DealView, ...prev])
    setForm({ title: '', contactId: '', valueCents: '' })
    setShowNew(false)
    setActiveDealId(data.deal.id)
  }

  async function handleMove(dealId: string, stageId: string) {
    const data = await api.updateCrmDeal(dealId, { stageId })
    setDeals(prev => prev.map(d => (d.id === dealId ? data.deal as DealView : d)))
    if (activeDeal?.id === dealId) setActiveDeal(data.deal as DealView)
  }

  async function addNote() {
    if (!activeDealId || !note.trim()) return
    await api.addCrmDealNote(activeDealId, note.trim())
    setNote('')
    const d = await api.getCrmDeal(activeDealId)
    setActiveDeal(d.deal as DealView)
  }

  async function addTask() {
    if (!activeDealId || !taskTitle.trim()) return
    await api.addCrmDealTask(activeDealId, { title: taskTitle.trim(), dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : null })
    setTaskTitle('')
    setTaskDueAt('')
    const [d, t] = await Promise.all([api.getCrmDeal(activeDealId), api.getCrmTasks({ status: 'OPEN' })])
    setActiveDeal(d.deal as DealView)
    setTasks(t.tasks ?? [])
  }

  async function completeTask(taskId: string) {
    await api.updateCrmTask(taskId, { status: 'DONE' })
    if (activeDealId) {
      const d = await api.getCrmDeal(activeDealId)
      setActiveDeal(d.deal as DealView)
    }
    const t = await api.getCrmTasks({ status: 'OPEN' })
    setTasks(t.tasks ?? [])
  }

  async function saveSetting() {
    if (!setting) return
    setSavingSetting(true)
    try {
      const data = await api.updateFollowUpSetting({
        enabled: setting.enabled,
        delayMinutes: setting.delayMinutes,
        messageTemplate: setting.messageTemplate,
      })
      setSetting(data.setting)
    } finally {
      setSavingSetting(false)
    }
  }

  return (
    <div className="ops-designer-page crm-designer-page flex flex-col gap-4">
      <SectionHeader
        title="CRM"
        description="Funil, follow-up e previsao comercial"
        right={
          <div className="flex items-center gap-2">
            <select value={pipelineId ?? ''} onChange={e => setPipelineId(e.target.value || null)} className="h-10 rounded-xl px-3 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}>
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button variant="primary" onClick={() => setShowNew(v => !v)}><Plus size={16} /> Novo negocio</Button>
          </div>
        }
      />

      <div className="ops-metric-strip">
        <div className="ops-metric-card brand"><span>Negocios abertos</span><strong>{metrics.open}</strong></div>
        <div className="ops-metric-card"><span>Previsao ponderada</span><strong>{money(metrics.weighted)}</strong></div>
        <div className="ops-metric-card"><span>Receita ganha</span><strong>{money(metrics.revenue)}</strong></div>
        <div className="ops-metric-card"><span>Follow-ups</span><strong>{metrics.pendingFollowUps}</strong></div>
        <div className="ops-metric-card"><span>Tarefas vencidas</span><strong>{metrics.overdueTasks}</strong></div>
      </div>

      <Card className="ops-panel p-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['board', 'insights', 'settings'] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: view === v ? 'var(--primary)' : 'var(--bg)', color: view === v ? 'white' : 'var(--muted)', border: '1px solid var(--border-soft)' }}>
                {v === 'board' ? 'Operacao' : v === 'insights' ? 'Gestao' : 'Follow-up'}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3" style={{ color: 'var(--muted)' }} />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar negocio, contato ou telefone" className="pl-9 h-10" />
            </div>
            <select value={temperature} onChange={e => setTemperature(e.target.value as any)} className="h-10 rounded-xl px-3 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}>
              <option value="ALL">Todas temperaturas</option>
              <option value="HOT">Quentes</option>
              <option value="WARM">Mornos</option>
              <option value="COLD">Frios</option>
            </select>
          </div>
        </div>
      </Card>

      {showNew && (
        <Card className="ops-panel p-5">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Titulo do negocio" className="md:col-span-2" />
            <Input value={form.valueCents} onChange={e => setForm(f => ({ ...f, valueCents: e.target.value }))} placeholder="Valor em centavos" />
            <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} className="h-11 rounded-xl px-3 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }} required>
              <option value="">Contato</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{(c.name ? `${c.name} - ` : '')}{c.phone}</option>)}
            </select>
            <div className="md:col-span-4 flex gap-2"><Button type="submit" variant="primary">Salvar</Button><Button type="button" variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button></div>
          </form>
        </Card>
      )}

      {view === 'settings' && setting && (
        <Card className="ops-panel p-5">
          <div className="flex items-start gap-3 mb-5">
            <Settings2 size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Follow-up automatico</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Envia uma tentativa quando o cliente fica sem resposta.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <label className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>Ativar automacao</span>
              <input type="checkbox" checked={setting.enabled} onChange={e => setSetting({ ...setting, enabled: e.target.checked })} />
            </label>
            <div className="lg:col-span-2 rounded-2xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
              <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Prazo</div>
              <div className="flex gap-2">
                {delayOptions.map(d => (
                  <button key={d} type="button" onClick={() => setSetting({ ...setting, delayMinutes: d })} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: setting.delayMinutes === d ? 'var(--primary)' : 'var(--surface)', color: setting.delayMinutes === d ? 'white' : 'var(--muted)', border: '1px solid var(--border-soft)' }}>{d} min</button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <textarea value={setting.messageTemplate} onChange={e => setSetting({ ...setting, messageTemplate: e.target.value })} rows={5} className="w-full rounded-2xl p-4 text-sm outline-none" style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', color: 'var(--text)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Variaveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{empresa}}'}, {'{{negocio}}'}</p>
            </div>
            <div><Button variant="primary" onClick={saveSetting} loading={savingSetting}>Salvar configuracao</Button></div>
          </div>
        </Card>
      )}

      {view === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="ops-panel p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Performance por etapa</h3>
            <div className="space-y-3">
              {stages.map(stage => {
                const count = deals.filter(d => d.stage?.id === stage.id).length
                const width = deals.length ? Math.max(8, Math.round((count / deals.length) * 100)) : 0
                return <div key={stage.id}>
                  <div className="flex justify-between text-sm mb-1"><span>{stage.name}</span><strong>{count}</strong></div>
                  <div className="h-3 rounded-full" style={{ background: 'var(--bg)' }}><div className="h-3 rounded-full" style={{ width: `${width}%`, background: stage.color ?? 'var(--primary)' }} /></div>
                </div>
              })}
            </div>
          </Card>
          <Card className="ops-panel p-5">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Fila de acao</h3>
            <div className="space-y-3">
              {tasks.slice(0, 8).map(t => <div key={t.id} className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}><div className="text-sm font-semibold">{t.title}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{shortDate(t.dueAt)} - {t.deal?.title ?? t.contact?.phone}</div></div>)}
              {tasks.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>Sem tarefas abertas.</p>}
            </div>
          </Card>
        </div>
      )}

      {view === 'board' && (
        loading ? <div className="flex items-center justify-center h-40"><div className="ui-spinner" /></div> :
        stages.length === 0 ? <EmptyState title="Nenhum estagio" description="Crie um pipeline para comecar." className="border-2 border-dashed" /> :
        <div className="crm-board-grid">
          {stages.map(stage => {
            const list = grouped.get(stage.id) ?? []
            return (
              <Card key={stage.id} className="ops-panel p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{stage.name}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{list.length} negocios</p></div>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color ?? 'var(--border)' }} />
                </div>
                <div className="flex flex-col gap-2">
                  {list.map(d => {
                    const nextTask = d.tasks?.[0]
                    const follow = d.followUps?.[0]
                    return (
                      <button key={d.id} type="button" onClick={() => setActiveDealId(d.id)} className="text-left p-3 rounded-2xl transition-colors" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0"><div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{d.title}</div><div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{d.contact?.name ?? d.contact?.phone}</div></div>
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: `${scoreColor(d.aiScore)}22`, color: scoreColor(d.aiScore) }}>{scoreLabel(d.aiScore)}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                          <span><DollarSign size={12} className="inline mr-1" />{money(d.valueCents, d.currency)}</span>
                          <span><Target size={12} className="inline mr-1" />{d.aiScore ?? 0}%</span>
                          <span><Clock3 size={12} className="inline mr-1" />{nextTask ? shortDate(nextTask.dueAt) : 'Sem tarefa'}</span>
                          <span><MessageCircle size={12} className="inline mr-1" />{follow ? shortDate(follow.dueAt) : 'Sem follow-up'}</span>
                        </div>
                        {d.aiNextAction && <div className="mt-2 text-xs p-2 rounded-xl" style={{ background: 'var(--surface)', color: 'var(--text)' }}>{d.aiNextAction}</div>}
                      </button>
                    )
                  })}
                  {list.length === 0 && <div className="text-xs" style={{ color: 'var(--muted)' }}>Sem negocios</div>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeDeal && (
        <Card className="ops-panel p-5">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2"><h3 className="font-semibold" style={{ color: 'var(--text)' }}>{activeDeal.title}</h3><span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${scoreColor(activeDeal.aiScore)}22`, color: scoreColor(activeDeal.aiScore) }}><Flame size={12} className="inline mr-1" />{scoreLabel(activeDeal.aiScore)}</span></div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{activeDeal.contact?.name ?? activeDeal.contact?.phone} - {money(activeDeal.valueCents, activeDeal.currency)}</p>
            </div>
            <Button variant="ghost" onClick={() => setActiveDealId(null)}><X size={16} /> Fechar</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {activeDeal.aiNextAction && <div className="p-4 rounded-2xl" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}><strong>Proxima acao:</strong> {activeDeal.aiNextAction}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stages.map(s => <button key={s.id} type="button" onClick={() => handleMove(activeDeal.id, s.id)} className="p-3 rounded-xl text-sm font-semibold" style={{ background: activeDeal.stage?.id === s.id ? 'var(--primary)' : 'var(--bg)', color: activeDeal.stage?.id === s.id ? 'white' : 'var(--text)', border: '1px solid var(--border-soft)' }}>{s.name}</button>)}
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Notas</h4>
                <div className="flex gap-2 mb-3"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Adicionar nota" /><Button variant="primary" onClick={addNote}>Salvar</Button></div>
                <div className="space-y-2">{(activeDeal.notes ?? []).slice(0, 8).map(n => <div key={n.id} className="p-3 rounded-xl text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}><div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{shortDate(n.createdAt)}</div>{n.content}</div>)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Follow-up</h4>
                {(activeDeal.followUps ?? []).slice(0, 4).map(f => <div key={f.id} className="text-sm flex justify-between py-2"><span>{f.status}</span><strong>{shortDate(f.dueAt)}</strong></div>)}
                {(activeDeal.followUps ?? []).length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>Nenhum follow-up registrado.</p>}
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Tarefas</h4>
                <div className="space-y-2 mb-3">
                  {(activeDeal.tasks ?? []).slice(0, 6).map(t => <div key={t.id} className="flex items-center justify-between gap-2 text-sm"><span>{t.title}<br /><small style={{ color: 'var(--muted)' }}>{shortDate(t.dueAt)}</small></span>{t.status === 'OPEN' && <button onClick={() => completeTask(t.id)} className="p-2 rounded-lg" style={{ background: 'var(--surface)', color: 'var(--teal)' }}><Check size={14} /></button>}</div>)}
                </div>
                <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Nova tarefa" className="mb-2" />
                <Input type="datetime-local" value={taskDueAt} onChange={e => setTaskDueAt(e.target.value)} className="mb-2" />
                <Button variant="primary" onClick={addTask}>Adicionar tarefa</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
