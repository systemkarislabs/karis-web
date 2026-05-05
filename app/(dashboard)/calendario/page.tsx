'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { Appointment, GoogleIntegrationStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function CalendarioPage() {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({ title: '', startAt: '', endAt: '' })

  const range = useMemo(() => {
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    return { timeMin, timeMax }
  }, [])

  async function refreshAll() {
    const s = await api.getGoogleStatus()
    setStatus(s)

    const ap = await api.getAppointments()
    setAppointments(ap.appointments ?? [])

    if (s.connected) {
      const ev = await api.getGoogleEvents({ timeMin: range.timeMin, timeMax: range.timeMax, maxResults: 20 })
      setEvents(ev.events ?? [])
    } else {
      setEvents([])
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    refreshAll()
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const { url } = await api.getGoogleAuthUrl()
      window.location.href = url
    } catch { /* noop */ }
    finally { setConnecting(false) }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar Google Calendar?')) return
    try {
      await api.disconnectGoogle()
      await refreshAll()
    } catch { /* noop */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.startAt || !form.endAt) return
    setCreating(true)
    try {
      await api.createAppointment({
        title: form.title.trim(),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      })
      setForm({ title: '', startAt: '', endAt: '' })
      await refreshAll()
    } catch { /* noop */ }
    finally { setCreating(false) }
  }

  function renderEventTime(ev: any) {
    const start = ev?.start?.dateTime || ev?.start?.date
    const end = ev?.end?.dateTime || ev?.end?.date
    if (!start) return ''
    const s = new Date(start)
    const e = end ? new Date(end) : null
    return `${s.toLocaleString('pt-BR')}${e ? ` → ${e.toLocaleString('pt-BR')}` : ''}`
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <SectionHeader title="Calendário" description="Agendamentos e Google Calendar" />

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Integração Google</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {status?.connected ? 'Conectado' : 'Não conectado'}
              {status && !status.hasGoogleConfig ? ' • OAuth não configurado no servidor' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {status?.connected ? (
              <Button variant="danger" onClick={handleDisconnect}>
                Desconectar
              </Button>
            ) : (
              <Button variant="primary" loading={connecting} onClick={handleConnect} disabled={status?.hasGoogleConfig === false}>
                Conectar Google
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Novo agendamento</p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Título</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Ex: Reunião com cliente" />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Início</label>
            <Input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Fim</label>
            <Input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} required />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Button type="submit" variant="primary" loading={creating}>Criar</Button>
          </div>
          <p className="text-xs md:col-span-3" style={{ color: 'var(--muted)' }}>
            Se o Google estiver conectado, o evento também é criado no seu Calendar.
          </p>
        </form>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="ui-spinner" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="p-5">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Próximos eventos (Google)</p>
            {!status?.connected ? (
              <EmptyState title="Google não conectado" description="Conecte sua conta para ver os eventos." className="border-2 border-dashed" />
            ) : events.length === 0 ? (
              <EmptyState title="Sem eventos" description="Não há eventos no período selecionado." className="border-2 border-dashed" />
            ) : (
              <div className="flex flex-col gap-2">
                {events.slice(0, 12).map((ev: any) => (
                  <div key={ev.id} className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{ev.summary ?? 'Sem título'}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{renderEventTime(ev)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Agendamentos (Sistema)</p>
            {appointments.length === 0 ? (
              <EmptyState title="Sem agendamentos" description="Crie um agendamento para começar." className="border-2 border-dashed" />
            ) : (
              <div className="flex flex-col gap-2">
                {appointments.slice(0, 12).map(a => (
                  <div key={a.id} className="p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{a.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {new Date(a.startAt).toLocaleString('pt-BR')} → {new Date(a.endAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

